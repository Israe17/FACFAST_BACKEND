import { Injectable, Logger } from '@nestjs/common';
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
import { DispatchType } from '../enums/dispatch-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from '../policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';

export type MarkDispatchOrderReadyCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  idempotency_key?: string | null;
};

@Injectable()
export class MarkDispatchOrderReadyUseCase
  implements CommandUseCase<MarkDispatchOrderReadyCommand, DispatchOrderView>
{
  private readonly logger = new Logger(MarkDispatchOrderReadyUseCase.name);

  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_sale_order_policy: DispatchSaleOrderPolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    idempotency_key,
  }: MarkDispatchOrderReadyCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.ready.${dispatch_order_id}`,
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
        this.dispatch_order_lifecycle_policy.assert_readyable(order);
        this.assert_order_can_be_marked_ready(order);

        order.status = DispatchOrderStatus.READY;
        await manager.getRepository(DispatchOrder).save(order);

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

  private assert_order_can_be_marked_ready(order: DispatchOrder): void {
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

    if (
      order.dispatch_type === DispatchType.INDIVIDUAL &&
      order.stops.length > 1
    ) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_INDIVIDUAL_REQUIRES_SINGLE_SALE_ORDER',
        messageKey:
          'inventory.dispatch_order_individual_requires_single_sale_order',
        details: {
          dispatch_order_id: order.id,
          stop_count: order.stops.length,
        },
      });
    }

    for (const stop of order.stops) {
      if (!stop.sale_order) {
        throw new DomainBadRequestException({
          code: 'DISPATCH_STOP_SALE_ORDER_REQUIRED',
          messageKey: 'inventory.dispatch_stop_sale_order_required',
          details: {
            dispatch_order_id: order.id,
            dispatch_stop_id: stop.id,
            sale_order_id: stop.sale_order_id,
          },
        });
      }

      this.dispatch_sale_order_policy.assert_dispatch_order_sale_order(
        order.branch_id,
        stop.sale_order,
        order.origin_warehouse_id,
      );
      this.dispatch_sale_order_policy.assert_date_coherence(
        order.scheduled_date,
        stop.sale_order,
      );
    }

    const stops_missing_coords = order.stops.filter(
      (stop) =>
        stop.delivery_latitude === null || stop.delivery_longitude === null,
    );
    if (stops_missing_coords.length > 0) {
      const stop_ids = stops_missing_coords.map((s) => s.id).join(', ');
      this.logger.warn(
        `Dispatch order ${order.id} marked ready with ${stops_missing_coords.length} stop(s) missing coordinates: [${stop_ids}]`,
      );
    }
  }
}
