import { Injectable } from '@nestjs/common';
import { TransitionPolicy } from '../../common/application/interfaces/transition-policy.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';

export type DispatchOrderTransition =
  | 'edit'
  | 'dispatch'
  | 'complete'
  | 'cancel';

@Injectable()
export class DispatchOrderLifecyclePolicy
  implements
    TransitionPolicy<Pick<DispatchOrder, 'status'>, DispatchOrderTransition>
{
  assert_transition_allowed(
    order: Pick<DispatchOrder, 'status'>,
    transition: DispatchOrderTransition,
  ): void {
    switch (transition) {
      case 'edit':
        if (
          order.status !== DispatchOrderStatus.DRAFT &&
          order.status !== DispatchOrderStatus.READY
        ) {
          throw new DomainConflictException({
            code: 'DISPATCH_ORDER_NOT_EDITABLE',
            messageKey: 'inventory.dispatch_order_not_editable',
            details: { status: order.status },
          });
        }
        return;
      case 'dispatch':
        if (order.status !== DispatchOrderStatus.READY) {
          throw new DomainConflictException({
            code: 'DISPATCH_ORDER_NOT_READY',
            messageKey: 'inventory.dispatch_order_not_ready',
            details: { status: order.status },
          });
        }
        return;
      case 'complete':
        if (
          order.status !== DispatchOrderStatus.DISPATCHED &&
          order.status !== DispatchOrderStatus.IN_TRANSIT
        ) {
          throw new DomainConflictException({
            code: 'DISPATCH_ORDER_NOT_IN_PROGRESS',
            messageKey: 'inventory.dispatch_order_not_in_progress',
            details: { status: order.status },
          });
        }
        return;
      case 'cancel':
        if (
          order.status === DispatchOrderStatus.CANCELLED ||
          order.status === DispatchOrderStatus.COMPLETED
        ) {
          throw new DomainConflictException({
            code: 'DISPATCH_ORDER_CANNOT_CANCEL',
            messageKey: 'inventory.dispatch_order_cannot_cancel',
            details: { status: order.status },
          });
        }
        return;
    }
  }

  assert_editable(order: Pick<DispatchOrder, 'status'>): void {
    this.assert_transition_allowed(order, 'edit');
  }

  assert_dispatchable(order: Pick<DispatchOrder, 'status'>): void {
    this.assert_transition_allowed(order, 'dispatch');
  }

  assert_completable(order: Pick<DispatchOrder, 'status'>): void {
    this.assert_transition_allowed(order, 'complete');
  }

  assert_cancellable(order: Pick<DispatchOrder, 'status'>): void {
    this.assert_transition_allowed(order, 'cancel');
  }
}
