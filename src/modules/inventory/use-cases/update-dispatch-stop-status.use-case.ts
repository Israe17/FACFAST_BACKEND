import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
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
import { DispatchStopLine } from '../entities/dispatch-stop-line.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { InventoryLedgerService } from '../services/inventory-ledger.service';
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
    private readonly inventory_ledger_service: InventoryLedgerService,
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

          // Handle inventory reversal for non-delivered stops
          await this.handle_stop_inventory_return(
            manager,
            current_user,
            order,
            stop,
            business_id,
            dto,
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

  private async handle_stop_inventory_return(
    manager: EntityManager,
    current_user: AuthenticatedUserContext,
    order: DispatchOrder,
    stop: DispatchStop,
    business_id: number,
    dto: UpdateDispatchStopStatusDto,
  ): Promise<void> {
    // Delivered → no return needed
    if (stop.status === DispatchStopStatus.DELIVERED) {
      // Mark all stop lines as fully delivered
      await manager.getRepository(DispatchStopLine).update(
        { dispatch_stop_id: stop.id },
        { delivered_quantity: () => 'ordered_quantity' },
      );
      return;
    }

    const stop_lines = await manager.getRepository(DispatchStopLine).find({
      where: { dispatch_stop_id: stop.id },
      relations: ['product_variant'],
    });

    if (stop_lines.length === 0) {
      return;
    }

    // Load the sale order warehouse for the inventory movement
    const sale_order = await manager.getRepository(SaleOrder).findOne({
      where: { id: stop.sale_order_id, business_id },
      relations: ['warehouse'],
    });
    if (!sale_order?.warehouse) {
      return;
    }

    type ReturnLine = {
      product_variant: NonNullable<DispatchStopLine['product_variant']>;
      return_quantity: number;
    };
    const return_lines: ReturnLine[] = [];

    if (
      stop.status === DispatchStopStatus.FAILED ||
      stop.status === DispatchStopStatus.SKIPPED
    ) {
      // Return 100% of all lines
      for (const stop_line of stop_lines) {
        stop_line.delivered_quantity = 0;
        await manager.getRepository(DispatchStopLine).save(stop_line);

        if (stop_line.product_variant && stop_line.ordered_quantity > 0) {
          return_lines.push({
            product_variant: stop_line.product_variant,
            return_quantity: stop_line.ordered_quantity,
          });
        }
      }
    } else if (stop.status === DispatchStopStatus.PARTIAL) {
      // Partial: require delivered_lines from DTO
      if (!dto.delivered_lines?.length) {
        throw new DomainBadRequestException({
          code: 'DISPATCH_STOP_DELIVERED_LINES_REQUIRED',
          messageKey: 'inventory.dispatch_stop_delivered_lines_required',
          details: { dispatch_stop_id: stop.id },
        });
      }

      const delivered_map = new Map(
        dto.delivered_lines.map((dl) => [dl.sale_order_line_id, dl.delivered_quantity]),
      );

      for (const stop_line of stop_lines) {
        const delivered = delivered_map.get(stop_line.sale_order_line_id) ?? 0;

        if (delivered > stop_line.ordered_quantity) {
          throw new DomainBadRequestException({
            code: 'DISPATCH_STOP_DELIVERED_EXCEEDS_ORDERED',
            messageKey: 'inventory.dispatch_stop_delivered_exceeds_ordered',
            details: {
              sale_order_line_id: stop_line.sale_order_line_id,
              ordered_quantity: stop_line.ordered_quantity,
              delivered_quantity: delivered,
            },
          });
        }

        stop_line.delivered_quantity = delivered;
        await manager.getRepository(DispatchStopLine).save(stop_line);

        const return_qty = stop_line.ordered_quantity - delivered;
        if (return_qty > 0 && stop_line.product_variant) {
          return_lines.push({
            product_variant: stop_line.product_variant,
            return_quantity: return_qty,
          });
        }
      }
    }

    // Post the DISPATCH_RETURN inventory movement
    if (return_lines.length > 0) {
      await this.inventory_ledger_service.post_posted_movement(
        manager,
        {
          business_id,
          branch_id: sale_order.branch_id,
          performed_by_user_id: current_user.id,
          occurred_at: new Date(),
          movement_type: InventoryMovementHeaderType.DISPATCH_RETURN,
          source_document_type: 'DispatchOrder',
          source_document_id: order.id,
          source_document_number: order.code,
          notes: `Devolucion de stock por entrega ${stop.status} - orden ${sale_order.code}`,
        },
        return_lines.map((line) => ({
          warehouse: sale_order.warehouse!,
          product_variant: line.product_variant,
          quantity: line.return_quantity,
          on_hand_delta: line.return_quantity,
        })),
      );
    }
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
