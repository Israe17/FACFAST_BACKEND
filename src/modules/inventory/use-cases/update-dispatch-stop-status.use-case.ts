import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { UpdateDispatchStopStatusDto } from '../dto/update-dispatch-stop-status.dto';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { get_dispatch_status_for_resolved_stop } from '../../sales/utils/sale-dispatch-status.util';

export type UpdateDispatchStopStatusCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  dispatch_stop_id: number;
  dto: UpdateDispatchStopStatusDto;
  idempotency_key?: string | null;
};

@Injectable()
export class UpdateDispatchStopStatusUseCase
  implements
    CommandUseCase<UpdateDispatchStopStatusCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    dispatch_stop_id,
    dto,
    idempotency_key,
  }: UpdateDispatchStopStatusCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.stops.status.${dispatch_order_id}.${dispatch_stop_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          dispatch_order_id,
          dispatch_stop_id,
          status: dto.status,
          received_by: this.normalize_optional_string(dto.received_by),
          failure_reason: this.normalize_optional_string(dto.failure_reason),
          notes: this.normalize_optional_string(dto.notes),
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
        this.assert_order_allows_stop_updates(order);

        const stop = order.stops?.find((item) => item.id === dispatch_stop_id);
        if (!stop) {
          throw new DomainNotFoundException({
            code: 'DISPATCH_STOP_NOT_FOUND',
            messageKey: 'inventory.dispatch_stop_not_found',
            details: {
              dispatch_order_id,
              dispatch_stop_id,
            },
          });
        }

        this.assert_stop_transition_allowed(stop.status, dto.status);
        this.apply_stop_status(stop, dto);

        await manager.getRepository(DispatchStop).save(stop);

        if (order.status === DispatchOrderStatus.DISPATCHED) {
          order.status = DispatchOrderStatus.IN_TRANSIT;
          await manager.getRepository(DispatchOrder).save(order);
        }

        if (
          stop.status === DispatchStopStatus.DELIVERED ||
          stop.status === DispatchStopStatus.FAILED ||
          stop.status === DispatchStopStatus.PARTIAL ||
          stop.status === DispatchStopStatus.SKIPPED
        ) {
          await manager.getRepository(SaleOrder).update(
            {
              id: stop.sale_order_id,
              business_id,
            },
            {
              dispatch_status: get_dispatch_status_for_resolved_stop(
                stop.status,
              ),
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

  private assert_order_allows_stop_updates(order: DispatchOrder): void {
    if (
      order.status !== DispatchOrderStatus.DISPATCHED &&
      order.status !== DispatchOrderStatus.IN_TRANSIT
    ) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_STOPS_NOT_UPDATABLE',
        messageKey: 'inventory.dispatch_order_stops_not_updatable',
        details: {
          dispatch_order_id: order.id,
          status: order.status,
        },
      });
    }
  }

  private assert_stop_transition_allowed(
    current_status: DispatchStopStatus,
    target_status: DispatchStopStatus,
  ): void {
    const final_statuses = new Set<DispatchStopStatus>([
      DispatchStopStatus.DELIVERED,
      DispatchStopStatus.FAILED,
      DispatchStopStatus.PARTIAL,
      DispatchStopStatus.SKIPPED,
    ]);

    if (final_statuses.has(current_status)) {
      throw new DomainConflictException({
        code: 'DISPATCH_STOP_ALREADY_RESOLVED',
        messageKey: 'inventory.dispatch_stop_already_resolved',
        details: {
          current_status,
          target_status,
        },
      });
    }

    if (current_status === target_status) {
      throw new DomainConflictException({
        code: 'DISPATCH_STOP_STATUS_ALREADY_SET',
        messageKey: 'inventory.dispatch_stop_status_already_set',
        details: {
          current_status,
          target_status,
        },
      });
    }

    if (current_status === DispatchStopStatus.PENDING) {
      return;
    }

    if (
      current_status === DispatchStopStatus.IN_TRANSIT &&
      target_status !== DispatchStopStatus.PENDING &&
      target_status !== DispatchStopStatus.IN_TRANSIT
    ) {
      return;
    }

    throw new DomainConflictException({
      code: 'DISPATCH_STOP_INVALID_TRANSITION',
      messageKey: 'inventory.dispatch_stop_invalid_transition',
      details: {
        current_status,
        target_status,
      },
    });
  }

  private apply_stop_status(
    stop: DispatchStop,
    dto: UpdateDispatchStopStatusDto,
  ): void {
    stop.status = dto.status;

    if (dto.notes !== undefined) {
      stop.notes = this.normalize_optional_string(dto.notes);
    }

    switch (dto.status) {
      case DispatchStopStatus.IN_TRANSIT:
        stop.delivered_at = null;
        stop.received_by = null;
        stop.failure_reason = null;
        return;
      case DispatchStopStatus.DELIVERED: {
        const received_by = this.normalize_optional_string(dto.received_by);
        if (!received_by) {
          throw new DomainBadRequestException({
            code: 'DISPATCH_STOP_RECEIVED_BY_REQUIRED',
            messageKey: 'inventory.dispatch_stop_received_by_required',
            details: {
              dispatch_stop_id: stop.id,
              status: dto.status,
            },
          });
        }

        stop.delivered_at = new Date();
        stop.received_by = received_by;
        stop.failure_reason = null;
        return;
      }
      case DispatchStopStatus.FAILED:
      case DispatchStopStatus.PARTIAL:
      case DispatchStopStatus.SKIPPED: {
        const failure_reason = this.normalize_optional_string(dto.failure_reason);
        if (!failure_reason) {
          throw new DomainBadRequestException({
            code: 'DISPATCH_STOP_FAILURE_REASON_REQUIRED',
            messageKey: 'inventory.dispatch_stop_failure_reason_required',
            details: {
              dispatch_stop_id: stop.id,
              status: dto.status,
            },
          });
        }

        stop.delivered_at = null;
        stop.received_by = null;
        stop.failure_reason = failure_reason;
        return;
      }
      default:
        throw new DomainBadRequestException({
          code: 'DISPATCH_STOP_STATUS_NOT_SUPPORTED',
          messageKey: 'inventory.dispatch_stop_status_not_supported',
          details: {
            dispatch_stop_id: stop.id,
            status: dto.status,
          },
        });
    }
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
