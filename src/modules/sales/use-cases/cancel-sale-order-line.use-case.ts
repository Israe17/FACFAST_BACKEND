import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchStop } from '../../inventory/entities/dispatch-stop.entity';
import { DispatchStopLine } from '../../inventory/entities/dispatch-stop-line.entity';
import { ProductSerial } from '../../inventory/entities/product-serial.entity';
import { SerialEvent } from '../../inventory/entities/serial-event.entity';
import { InventoryMovementHeaderType } from '../../inventory/enums/inventory-movement-header-type.enum';
import { SerialEventType } from '../../inventory/enums/serial-event-type.enum';
import { SerialStatus } from '../../inventory/enums/serial-status.enum';
import { InventoryLedgerService } from '../../inventory/services/inventory-ledger.service';
import { InventoryReservationsRepository } from '../../inventory/repositories/inventory-reservations.repository';
import { InventoryReservationsService } from '../../inventory/services/inventory-reservations.service';
import { CancelSaleOrderLineDto } from '../dto/cancel-sale-order-line.dto';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderLine } from '../entities/sale-order-line.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderLineStatus } from '../enums/sale-order-line-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

export type CancelSaleOrderLineCommand = {
  current_user: AuthenticatedUserContext;
  order_id: number;
  line_id: number;
  dto: CancelSaleOrderLineDto;
};

@Injectable()
export class CancelSaleOrderLineUseCase
  implements CommandUseCase<CancelSaleOrderLineCommand, SaleOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly inventory_reservations_service: InventoryReservationsService,
    private readonly inventory_reservations_repository: InventoryReservationsRepository,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    order_id,
    line_id,
    dto,
  }: CancelSaleOrderLineCommand): Promise<SaleOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.data_source.transaction(async (manager) => {
      const order =
        await this.sale_orders_repository.find_by_id_in_business_for_update(
          manager,
          order_id,
          business_id,
        );
      if (!order) {
        throw new DomainNotFoundException({
          code: 'SALE_ORDER_NOT_FOUND',
          messageKey: 'sales.order_not_found',
          details: { order_id },
        });
      }

      this.sale_order_access_policy.assert_can_access_order(current_user, order);

      // Unlike full-order cancellation (which uses SaleOrderLifecyclePolicy.assert_cancellable
      // and blocks when dispatch_status != PENDING), line cancellation is allowed at any
      // dispatch_status as long as the line's reservation is still ACTIVE (pre-dispatch).
      // The reservation status check in release_for_sale_order_line() is the definitive guard.
      if (order.status !== SaleOrderStatus.CONFIRMED) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_NOT_CONFIRMED',
          messageKey: 'sales.order_not_confirmed',
        });
      }

      const line = (order.lines ?? []).find((l) => l.id === line_id);
      if (!line) {
        throw new DomainNotFoundException({
          code: 'SALE_ORDER_LINE_NOT_FOUND',
          messageKey: 'sales.line_not_found',
          details: { line_id },
        });
      }

      if (line.status === SaleOrderLineStatus.CANCELLED) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_LINE_ALREADY_CANCELLED',
          messageKey: 'sales.line_already_cancelled',
        });
      }

      // Release reservation for this line (throws if CONSUMED)
      const released_deltas =
        await this.inventory_reservations_service.release_for_sale_order_line(
          manager,
          current_user,
          order,
          line_id,
        );

      // Create RELEASE movement if there were deltas
      const reason_text = dto.reason ?? '';
      if (released_deltas.length > 0) {
        await this.inventory_ledger_service.post_posted_movement(
          manager,
          {
            business_id,
            branch_id: order.branch_id,
            performed_by_user_id: current_user.id,
            occurred_at: new Date(),
            movement_type: InventoryMovementHeaderType.RELEASE,
            source_document_type: 'SaleOrder',
            source_document_id: order.id,
            source_document_number: order.code,
            notes: `[Daño linea #${line.line_no}] ${reason_text} - Requiere ajuste manual de inventario`.trim(),
          },
          released_deltas.map((delta) => ({
            warehouse: delta.warehouse,
            product_variant: delta.product_variant,
            quantity: delta.quantity,
            reserved_delta: -delta.quantity,
          })),
        );
      }

      // Mark line as cancelled
      line.status = SaleOrderLineStatus.CANCELLED;
      await manager.getRepository(SaleOrderLine).save(line);

      // Append to internal notes
      order.internal_notes = `${order.internal_notes ?? ''}\n[Cancelacion linea #${line.line_no}] ${reason_text}`.trim();

      // Sync DO: remove dispatch stop line if exists
      await this.remove_dispatch_stop_line(manager, line_id);

      // Mark serials as DEFECTIVE if this is a serial-tracked product
      if (line.product_variant?.track_serials && order.warehouse_id) {
        await this.mark_serials_defective(
          manager,
          business_id,
          line.product_variant_id,
          order.warehouse_id,
          Number(line.quantity),
          current_user.id,
          reason_text,
        );
      }

      // Auto-cancel SO if all lines are cancelled
      const all_cancelled = (order.lines ?? []).every(
        (l) => l.status === SaleOrderLineStatus.CANCELLED,
      );
      if (all_cancelled) {
        order.status = SaleOrderStatus.CANCELLED;
        order.dispatch_status = SaleDispatchStatus.CANCELLED;
      }

      await manager.getRepository(SaleOrder).save(order);

      const full_order = await this.sale_orders_repository.find_by_id_in_business(
        order.id,
        business_id,
        manager,
      );

      const reservations =
        await this.inventory_reservations_repository.find_by_sale_order_id(
          business_id,
          order.id,
        );

      return this.sale_order_serializer.serialize(full_order!, reservations);
    });
  }

  private async remove_dispatch_stop_line(
    manager: EntityManager,
    sale_order_line_id: number,
  ): Promise<void> {
    const stop_line = await manager.getRepository(DispatchStopLine).findOne({
      where: { sale_order_line_id },
      relations: ['dispatch_stop'],
    });
    if (!stop_line) return;

    const dispatch_stop_id = stop_line.dispatch_stop_id;
    await manager.getRepository(DispatchStopLine).remove(stop_line);

    const remaining_count = await manager
      .getRepository(DispatchStopLine)
      .count({ where: { dispatch_stop_id } });

    if (remaining_count === 0) {
      const stop = await manager
        .getRepository(DispatchStop)
        .findOne({ where: { id: dispatch_stop_id } });
      if (stop) {
        await manager.getRepository(DispatchStop).remove(stop);
      }
    }
  }

  private async mark_serials_defective(
    manager: EntityManager,
    business_id: number,
    product_variant_id: number,
    warehouse_id: number,
    quantity: number,
    performed_by_user_id: number,
    reason: string,
  ): Promise<void> {
    const serial_repo = manager.getRepository(ProductSerial);
    const serials = await serial_repo.find({
      where: {
        business_id,
        product_variant_id,
        warehouse_id,
        status: SerialStatus.RESERVED,
      },
      take: quantity,
    });

    if (serials.length === 0) return;

    const event_repo = manager.getRepository(SerialEvent);
    for (const serial of serials) {
      const old_status = serial.status;
      serial.status = SerialStatus.DEFECTIVE;
      serial.sold_at = null;

      await serial_repo.save(serial);

      const event = event_repo.create({
        business_id,
        serial_id: serial.id,
        event_type: SerialEventType.STATUS_CHANGE,
        performed_by_user_id,
        notes: `${old_status} -> ${SerialStatus.DEFECTIVE}: Linea cancelada por daño${reason ? ' - ' + reason : ''}`,
        occurred_at: new Date(),
      });
      await event_repo.save(event);
    }
  }
}
