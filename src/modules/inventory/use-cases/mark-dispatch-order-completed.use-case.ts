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
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';

export type MarkDispatchOrderCompletedCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  idempotency_key?: string | null;
};

@Injectable()
export class MarkDispatchOrderCompletedUseCase
  implements
    CommandUseCase<MarkDispatchOrderCompletedCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    idempotency_key,
  }: MarkDispatchOrderCompletedCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.complete.${dispatch_order_id}`,
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
        this.dispatch_order_lifecycle_policy.assert_completable(order);
        this.assert_order_can_be_completed(order);

        order.status = DispatchOrderStatus.COMPLETED;
        order.completed_at = new Date();
        await manager.getRepository(DispatchOrder).save(order);

        for (const stop of order.stops ?? []) {
          if (stop.status !== DispatchStopStatus.DELIVERED) {
            continue;
          }

          await manager.getRepository(SaleOrder).update(
            {
              id: stop.sale_order_id,
              business_id,
            },
            {
              dispatch_status: SaleDispatchStatus.DELIVERED,
            },
          );
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

  private assert_order_can_be_completed(order: DispatchOrder): void {
    if (!order.stops?.length) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_STOPS_REQUIRED',
        messageKey: 'inventory.dispatch_order_stops_required',
        details: { dispatch_order_id: order.id },
      });
    }

    const unresolved_stop_ids = order.stops
      .filter(
        (stop) =>
          stop.status === DispatchStopStatus.PENDING ||
          stop.status === DispatchStopStatus.IN_TRANSIT,
      )
      .map((stop) => stop.id);

    if (unresolved_stop_ids.length > 0) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_STOPS_UNRESOLVED',
        messageKey: 'inventory.dispatch_order_stops_unresolved',
        details: {
          dispatch_order_id: order.id,
          dispatch_stop_ids: unresolved_stop_ids,
        },
      });
    }
  }
}
