import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLedgerService } from '../../inventory/services/inventory-ledger.service';
import { InventoryReservationsService } from '../../inventory/services/inventory-reservations.service';
import { InventoryMovementHeaderType } from '../../inventory/enums/inventory-movement-header-type.enum';
import { ProductSerial } from '../../inventory/entities/product-serial.entity';
import { SerialEvent } from '../../inventory/entities/serial-event.entity';
import { SerialStatus } from '../../inventory/enums/serial-status.enum';
import { SerialEventType } from '../../inventory/enums/serial-event-type.enum';
import { SaleOrderLineSerial } from '../entities/sale-order-line-serial.entity';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderInventoryPolicy } from '../policies/sale-order-inventory.policy';
import { SaleOrderLifecyclePolicy } from '../policies/sale-order-lifecycle.policy';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';
import { SalesValidationService } from '../services/sales-validation.service';
import { get_dispatch_status_for_fulfillment_mode } from '../utils/sale-dispatch-status.util';

export type ConfirmSaleOrderCommand = {
  current_user: AuthenticatedUserContext;
  order_id: number;
  idempotency_key?: string | null;
};

@Injectable()
export class ConfirmSaleOrderUseCase
  implements CommandUseCase<ConfirmSaleOrderCommand, SaleOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_inventory_policy: SaleOrderInventoryPolicy,
    private readonly sale_order_lifecycle_policy: SaleOrderLifecyclePolicy,
    private readonly inventory_reservations_service: InventoryReservationsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly sale_order_serializer: SaleOrderSerializer,
    private readonly sales_validation_service: SalesValidationService,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    order_id,
    idempotency_key,
  }: ConfirmSaleOrderCommand): Promise<SaleOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `sales.sale_orders.confirm.${order_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          order_id,
        },
      },
      async (manager) => {
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

        this.sale_order_access_policy.assert_can_access_order(
          current_user,
          order,
        );
        this.sale_order_lifecycle_policy.assert_confirmable(order);
        await this.sales_validation_service.validate_sale_order_references(
          current_user,
          {
            branch_id: order.branch_id,
            customer_contact_id: order.customer_contact_id,
            seller_user_id: order.seller_user_id,
            delivery_zone_id: order.delivery_zone_id,
            warehouse_id: order.warehouse_id,
            product_variant_ids: (order.lines ?? []).map(
              (line) => line.product_variant_id,
            ),
          },
        );
        await this.sale_order_inventory_policy.assert_order_can_reserve(
          manager,
          order,
        );

        const reservation_deltas =
          await this.inventory_reservations_service.reserve_for_sale_order(
            manager,
            current_user,
            order,
          );

        // Validate and reserve assigned serials
        for (const line of order.lines ?? []) {
          const line_serials = (line.assigned_serials ?? []).filter(
            (as) => as.assigned_at === null,
          );
          if (line_serials.length === 0) continue;

          const track_serials =
            line.product_variant?.product?.track_serials ?? false;
          if (!track_serials) continue;

          const serial_ids = line_serials.map((as) => as.product_serial_id);
          const serials = await manager
            .getRepository(ProductSerial)
            .findByIds(serial_ids);

          for (const serial of serials) {
            if (serial.status !== SerialStatus.AVAILABLE) {
              throw new DomainNotFoundException({
                code: 'SERIAL_NOT_AVAILABLE',
                messageKey: 'sales.serial_not_available',
                details: {
                  serial_number: serial.serial_number,
                  current_status: serial.status,
                },
              });
            }
            if (
              order.warehouse_id &&
              serial.warehouse_id !== order.warehouse_id
            ) {
              throw new DomainNotFoundException({
                code: 'SERIAL_WRONG_WAREHOUSE',
                messageKey: 'sales.serial_wrong_warehouse',
                details: {
                  serial_number: serial.serial_number,
                },
              });
            }

            serial.status = SerialStatus.RESERVED;
            await manager.getRepository(ProductSerial).save(serial);

            await manager.getRepository(SerialEvent).save(
              manager.getRepository(SerialEvent).create({
                business_id,
                serial_id: serial.id,
                event_type: SerialEventType.RESERVED_FOR_SALE,
                performed_by_user_id: current_user.id,
                notes: `Reservado para orden de venta ${order.code}`,
                occurred_at: new Date(),
              }),
            );
          }

          // Mark junction records as assigned
          for (const as of line_serials) {
            as.assigned_at = new Date();
            await manager.getRepository(SaleOrderLineSerial).save(as);
          }

          // Validate quantity matches serial count
          if (Math.round(line.quantity) !== serial_ids.length) {
            throw new DomainNotFoundException({
              code: 'SERIAL_QUANTITY_MISMATCH',
              messageKey: 'sales.serial_quantity_mismatch',
              details: {
                line_no: line.line_no,
                expected: Math.round(line.quantity),
                actual: serial_ids.length,
              },
            });
          }
        }

        order.status = SaleOrderStatus.CONFIRMED;
        order.dispatch_status = get_dispatch_status_for_fulfillment_mode(
          order.fulfillment_mode,
        );
        await manager.getRepository(SaleOrder).save(order);

        if (reservation_deltas.length > 0) {
          await this.inventory_ledger_service.post_posted_movement(
            manager,
            {
              business_id,
              branch_id: order.branch_id,
              performed_by_user_id: current_user.id,
              occurred_at: new Date(),
              movement_type: InventoryMovementHeaderType.SALES_ALLOCATED,
              source_document_type: 'SaleOrder',
              source_document_id: order.id,
              source_document_number: order.code,
              notes: `Reserva de stock para orden de venta ${order.code}`,
            },
            reservation_deltas.map((line) => ({
              warehouse: line.warehouse,
              product_variant: line.product_variant,
              quantity: line.quantity,
              reserved_delta: line.quantity,
            })),
          );
        }

        const full_order =
          await manager.getRepository(SaleOrder).findOne({
            where: {
              id: order.id,
              business_id,
            },
            relations: {
              customer_contact: true,
              seller: true,
              branch: true,
              delivery_zone: true,
              warehouse: true,
              created_by_user: true,
              lines: {
                product_variant: {
                  product: true,
                },
                assigned_serials: {
                  product_serial: true,
                },
              },
              delivery_charges: true,
            },
          });
        return this.sale_order_serializer.serialize(full_order!);
      },
    );
  }
}
