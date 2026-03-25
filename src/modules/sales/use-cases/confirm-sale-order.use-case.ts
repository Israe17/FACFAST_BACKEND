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
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderInventoryPolicy } from '../policies/sale-order-inventory.policy';
import { SaleOrderLifecyclePolicy } from '../policies/sale-order-lifecycle.policy';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

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

        order.status = SaleOrderStatus.CONFIRMED;
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
              },
              delivery_charges: true,
            },
          });
        return this.sale_order_serializer.serialize(full_order!);
      },
    );
  }
}
