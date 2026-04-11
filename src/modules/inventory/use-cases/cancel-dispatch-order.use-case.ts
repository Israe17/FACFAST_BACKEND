import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { InventoryLedgerService } from '../services/inventory-ledger.service';
import { InventoryReservationsService } from '../services/inventory-reservations.service';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { get_dispatch_status_for_fulfillment_mode } from '../../sales/utils/sale-dispatch-status.util';

export type CancelDispatchOrderCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  idempotency_key?: string | null;
};

@Injectable()
export class CancelDispatchOrderUseCase
  implements CommandUseCase<CancelDispatchOrderCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly inventory_reservations_service: InventoryReservationsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    idempotency_key,
  }: CancelDispatchOrderCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.cancel.${dispatch_order_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          dispatch_order_id,
        },
      },
      async (manager) => {
        const order =
          await this.dispatch_orders_repository.find_by_id_in_business_for_update(
            manager,
            dispatch_order_id,
            business_id,
          );
        if (!order) {
          throw new DomainNotFoundException({
            code: 'DISPATCH_ORDER_NOT_FOUND',
            messageKey: 'inventory.dispatch_order_not_found',
            details: { dispatch_order_id },
          });
        }

        this.dispatch_order_access_policy.assert_can_access_order(
          current_user,
          order,
        );
        this.dispatch_order_lifecycle_policy.assert_cancellable(order);

        const has_delivered_stops = (order.stops ?? []).some(
          (stop) => stop.status === DispatchStopStatus.DELIVERED,
        );
        if (has_delivered_stops) {
          throw new DomainBadRequestException({
            code: 'DISPATCH_ORDER_HAS_DELIVERED_STOPS',
            messageKey: 'inventory.dispatch_order_has_delivered_stops',
          });
        }

        const was_dispatched =
          order.status === DispatchOrderStatus.DISPATCHED ||
          order.status === DispatchOrderStatus.IN_TRANSIT;

        order.status = DispatchOrderStatus.CANCELLED;
        await manager.getRepository(DispatchOrder).save(order);

        const resolved_statuses = [
          DispatchStopStatus.DELIVERED,
          DispatchStopStatus.PARTIAL,
          DispatchStopStatus.FAILED,
          DispatchStopStatus.SKIPPED,
        ];

        // Revert each sale order's dispatch_status and handle inventory
        for (const stop of order.stops ?? []) {
          // Skip already-resolved stops — their inventory was already
          // handled when the stop was marked delivered/failed/partial
          if (was_dispatched && resolved_statuses.includes(stop.status)) {
            continue;
          }

          const sale_order =
            stop.sale_order ??
            (await manager
              .getRepository(SaleOrder)
              .createQueryBuilder('sale_order')
              .leftJoinAndSelect('sale_order.lines', 'line')
              .leftJoinAndSelect('line.product_variant', 'product_variant')
              .leftJoinAndSelect('sale_order.warehouse', 'warehouse')
              .where('sale_order.id = :id', { id: stop.sale_order_id })
              .andWhere('sale_order.business_id = :business_id', {
                business_id,
              })
              .getOne());
          if (!sale_order) {
            continue;
          }

          // If dispatch was already dispatched, we need to reverse the
          // consumed inventory back to reserved state
          if (was_dispatched) {
            const re_reserve_deltas =
              await this.inventory_reservations_service.unreserve_consumed_for_sale_order(
                manager,
                current_user,
                sale_order,
              );

            if (re_reserve_deltas.length > 0) {
              await this.inventory_ledger_service.post_posted_movement(
                manager,
                {
                  business_id,
                  branch_id: sale_order.branch_id,
                  performed_by_user_id: current_user.id,
                  occurred_at: new Date(),
                  movement_type:
                    InventoryMovementHeaderType.DISPATCH_CANCELLED,
                  source_document_type: 'DispatchOrder',
                  source_document_id: order.id,
                  source_document_number: order.code,
                  notes: `Reversion de stock por cancelacion de despacho ${order.code}`,
                },
                re_reserve_deltas.map((line) => ({
                  warehouse: line.warehouse,
                  product_variant: line.product_variant,
                  quantity: line.quantity,
                  on_hand_delta: line.quantity,
                  reserved_delta: line.quantity,
                })),
              );
            }
          }

          sale_order.dispatch_status = get_dispatch_status_for_fulfillment_mode(
            sale_order.fulfillment_mode,
          );
          await manager.getRepository(SaleOrder).save(sale_order);
        }

        const full_order =
          await this.dispatch_orders_repository.find_by_id_in_business(
            dispatch_order_id,
            business_id,
            manager,
          );
        return this.dispatch_order_serializer.serialize(full_order!);
      },
    );
  }
}
