import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLedgerService } from '../../inventory/services/inventory-ledger.service';
import { InventoryReservationsService } from '../../inventory/services/inventory-reservations.service';
import { InventoryMovementHeaderType } from '../../inventory/enums/inventory-movement-header-type.enum';
import { CancelSaleOrderDto } from '../dto/cancel-sale-order.dto';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderLifecyclePolicy } from '../policies/sale-order-lifecycle.policy';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

export type CancelSaleOrderCommand = {
  current_user: AuthenticatedUserContext;
  order_id: number;
  dto: CancelSaleOrderDto;
};

@Injectable()
export class CancelSaleOrderUseCase
  implements CommandUseCase<CancelSaleOrderCommand, SaleOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_lifecycle_policy: SaleOrderLifecyclePolicy,
    private readonly inventory_reservations_service: InventoryReservationsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    order_id,
    dto,
  }: CancelSaleOrderCommand): Promise<SaleOrderView> {
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
      this.sale_order_lifecycle_policy.assert_cancellable(order);

      const was_confirmed = order.status === SaleOrderStatus.CONFIRMED;
      const released_deltas =
        await this.inventory_reservations_service.release_for_sale_order(
          manager,
          current_user,
          order,
        );

      order.status = SaleOrderStatus.CANCELLED;
      order.dispatch_status = SaleDispatchStatus.CANCELLED;
      order.internal_notes = dto.reason
        ? `${order.internal_notes ?? ''}\n[Cancelacion] ${dto.reason}`.trim()
        : order.internal_notes;
      await manager.getRepository(SaleOrder).save(order);

      if (was_confirmed && released_deltas.length > 0) {
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
            notes: `Liberacion de stock por cancelacion de orden ${order.code}`,
          },
          released_deltas.map((line) => ({
            warehouse: line.warehouse,
            product_variant: line.product_variant,
            quantity: line.quantity,
            reserved_delta: -line.quantity,
          })),
        );
      }

      const full_order = await this.sale_orders_repository.find_by_id_in_business(
        order.id,
        business_id,
      );
      return this.sale_order_serializer.serialize(full_order!);
    });
  }
}
