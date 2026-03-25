import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { UserStatus } from '../../common/enums/user-status.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from '../policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { InventoryLedgerService } from '../services/inventory-ledger.service';
import { InventoryReservationsService } from '../services/inventory-reservations.service';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';

export type MarkDispatchOrderDispatchedCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  idempotency_key?: string | null;
};

@Injectable()
export class MarkDispatchOrderDispatchedUseCase
  implements
    CommandUseCase<MarkDispatchOrderDispatchedCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_sale_order_policy: DispatchSaleOrderPolicy,
    private readonly inventory_reservations_service: InventoryReservationsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    idempotency_key,
  }: MarkDispatchOrderDispatchedCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.dispatch.${dispatch_order_id}`,
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
        this.dispatch_order_lifecycle_policy.assert_dispatchable(order);
        this.assert_order_can_be_dispatched(order);

        order.status = DispatchOrderStatus.DISPATCHED;
        order.dispatched_at = new Date();
        await manager.getRepository(DispatchOrder).save(order);

        for (const stop of order.stops ?? []) {
          const sale_order = await manager
            .getRepository(SaleOrder)
            .createQueryBuilder('sale_order')
            .setLock('pessimistic_write')
            .leftJoinAndSelect('sale_order.lines', 'line')
            .leftJoinAndSelect('line.product_variant', 'product_variant')
            .leftJoinAndSelect('sale_order.warehouse', 'warehouse')
            .where('sale_order.id = :id', { id: stop.sale_order_id })
            .andWhere('sale_order.business_id = :business_id', { business_id })
            .getOne();

          if (!sale_order || !sale_order.warehouse) {
            continue;
          }

          this.dispatch_sale_order_policy.assert_dispatchable_sale_order(
            order.branch_id,
            sale_order,
          );

          const consumed_deltas =
            await this.inventory_reservations_service.consume_for_sale_order(
              manager,
              current_user,
              sale_order,
            );
          sale_order.dispatch_status = SaleDispatchStatus.DISPATCHED;
          await manager.getRepository(SaleOrder).save(sale_order);

          if (consumed_deltas.length > 0) {
            await this.inventory_ledger_service.post_posted_movement(
              manager,
              {
                business_id,
                branch_id: sale_order.branch_id,
                performed_by_user_id: current_user.id,
                occurred_at: new Date(),
                movement_type: InventoryMovementHeaderType.SALES_DISPATCH,
                source_document_type: 'DispatchOrder',
                source_document_id: order.id,
                source_document_number: order.code,
                notes: `Despacho de stock para orden de venta ${sale_order.code}`,
              },
              consumed_deltas.map((line) => ({
                warehouse: line.warehouse,
                product_variant: line.product_variant,
                quantity: line.quantity,
                on_hand_delta: -line.quantity,
                reserved_delta: -line.quantity,
              })),
            );
          }
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

  private assert_order_can_be_dispatched(order: DispatchOrder): void {
    if (!order.scheduled_date) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_SCHEDULED_DATE_REQUIRED',
        messageKey: 'inventory.dispatch_order_scheduled_date_required',
        details: { dispatch_order_id: order.id },
      });
    }

    if (!order.vehicle_id || !order.vehicle) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_VEHICLE_REQUIRED',
        messageKey: 'inventory.dispatch_order_vehicle_required',
        details: { dispatch_order_id: order.id },
      });
    }

    if (!order.vehicle.is_active) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_VEHICLE_INACTIVE',
        messageKey: 'inventory.dispatch_order_vehicle_inactive',
        details: {
          dispatch_order_id: order.id,
          vehicle_id: order.vehicle_id,
        },
      });
    }

    if (!order.driver_user_id || !order.driver_user) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_DRIVER_REQUIRED',
        messageKey: 'inventory.dispatch_order_driver_required',
        details: { dispatch_order_id: order.id },
      });
    }

    if (order.driver_user.status !== UserStatus.ACTIVE) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_DRIVER_INACTIVE',
        messageKey: 'inventory.dispatch_order_driver_inactive',
        details: {
          dispatch_order_id: order.id,
          driver_user_id: order.driver_user_id,
        },
      });
    }

    if (order.route_id && (!order.route || order.route.is_active === false)) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_ROUTE_INACTIVE',
        messageKey: 'inventory.dispatch_order_route_inactive',
        details: {
          dispatch_order_id: order.id,
          route_id: order.route_id,
        },
      });
    }

    if (!order.stops?.length) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_STOPS_REQUIRED',
        messageKey: 'inventory.dispatch_order_stops_required',
        details: { dispatch_order_id: order.id },
      });
    }
  }
}
