import { Injectable } from '@nestjs/common';
import { TransitionPolicy } from '../../common/application/interfaces/transition-policy.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { can_cancel_sale_order_with_dispatch_status } from '../utils/sale-dispatch-status.util';

export type SaleOrderTransition = 'confirm' | 'edit' | 'cancel' | 'delete';

@Injectable()
export class SaleOrderLifecyclePolicy
  implements
    TransitionPolicy<
      Pick<SaleOrder, 'status' | 'dispatch_status'>,
      SaleOrderTransition
    >
{
  assert_transition_allowed(
    order: Pick<SaleOrder, 'status' | 'dispatch_status'>,
    transition: SaleOrderTransition,
  ): void {
    switch (transition) {
      case 'confirm':
        if (order.status !== SaleOrderStatus.DRAFT) {
          throw new DomainConflictException({
            code: 'SALE_ORDER_NOT_CONFIRMABLE',
            messageKey: 'sales.order_not_confirmable',
            details: { status: order.status },
          });
        }
        return;
      case 'edit':
        if (order.status !== SaleOrderStatus.DRAFT) {
          throw new DomainConflictException({
            code: 'SALE_ORDER_NOT_EDITABLE',
            messageKey: 'sales.order_not_editable',
            details: { status: order.status },
          });
        }
        return;
      case 'cancel':
        if (order.status === SaleOrderStatus.CANCELLED) {
          throw new DomainConflictException({
            code: 'SALE_ORDER_ALREADY_CANCELLED',
            messageKey: 'sales.order_already_cancelled',
            details: { status: order.status },
          });
        }

        if (
          !can_cancel_sale_order_with_dispatch_status(
            order.dispatch_status ?? SaleDispatchStatus.PENDING,
          )
        ) {
          throw new DomainConflictException({
            code: 'SALE_ORDER_CANNOT_CANCEL_AFTER_LOGISTICS',
            messageKey: 'sales.order_cannot_cancel_after_logistics',
            details: {
              status: order.status,
              dispatch_status: order.dispatch_status,
            },
          });
        }
        return;
      case 'delete':
        if (
          order.status !== SaleOrderStatus.DRAFT &&
          order.status !== SaleOrderStatus.CANCELLED
        ) {
          throw new DomainBadRequestException({
            code: 'SALE_ORDER_DELETE_NOT_ALLOWED',
            messageKey: 'sales.order_delete_not_allowed',
            details: { status: order.status },
          });
        }
        return;
    }
  }

  assert_confirmable(order: Pick<SaleOrder, 'status' | 'dispatch_status'>): void {
    this.assert_transition_allowed(order, 'confirm');
  }

  assert_editable(order: Pick<SaleOrder, 'status' | 'dispatch_status'>): void {
    this.assert_transition_allowed(order, 'edit');
  }

  assert_cancellable(order: Pick<SaleOrder, 'status' | 'dispatch_status'>): void {
    this.assert_transition_allowed(order, 'cancel');
  }

  assert_dispatch_resettable(
    order: Pick<SaleOrder, 'status' | 'dispatch_status'>,
  ): void {
    if (order.status !== SaleOrderStatus.CONFIRMED) {
      throw new DomainConflictException({
        code: 'SALE_ORDER_DISPATCH_RESET_REQUIRES_CONFIRMED',
        messageKey: 'sales.order_dispatch_reset_requires_confirmed',
        details: { status: order.status },
      });
    }

    if (
      order.dispatch_status !== SaleDispatchStatus.FAILED &&
      order.dispatch_status !== SaleDispatchStatus.PARTIAL
    ) {
      throw new DomainConflictException({
        code: 'SALE_ORDER_DISPATCH_RESET_INVALID_STATUS',
        messageKey: 'sales.order_dispatch_reset_invalid_status',
        details: { dispatch_status: order.dispatch_status },
      });
    }
  }

  assert_deletable(
    order: Pick<SaleOrder, 'status' | 'dispatch_status'>,
    order_id: number,
  ): void {
    try {
      this.assert_transition_allowed(order, 'delete');
    } catch (error) {
      if (error instanceof DomainBadRequestException) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_DELETE_NOT_ALLOWED',
          messageKey: 'sales.order_delete_not_allowed',
          details: { order_id, status: order.status },
        });
      }
      throw error;
    }
  }
}
