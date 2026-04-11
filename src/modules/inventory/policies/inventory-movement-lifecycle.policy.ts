import { Injectable } from '@nestjs/common';
import { TransitionPolicy } from '../../common/application/interfaces/transition-policy.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { InventoryMovementStatus } from '../enums/inventory-movement-status.enum';

type MovementForLifecycle = {
  status: InventoryMovementStatus;
  source_document_type?: string | null;
};

@Injectable()
export class InventoryMovementLifecyclePolicy
  implements TransitionPolicy<MovementForLifecycle, 'cancel'>
{
  assert_transition_allowed(
    movement: MovementForLifecycle,
    transition: 'cancel',
  ): void {
    if (transition !== 'cancel') {
      return;
    }

    if (movement.status === InventoryMovementStatus.CANCELLED) {
      throw new DomainConflictException({
        code: 'INVENTORY_MOVEMENT_ALREADY_CANCELLED',
        messageKey: 'inventory.movement_already_cancelled',
        details: { status: movement.status },
      });
    }

    if (movement.status !== InventoryMovementStatus.POSTED) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_MOVEMENT_POSTED_REQUIRED',
        messageKey: 'inventory.movement_posted_required',
        details: { status: movement.status },
      });
    }
  }

  assert_cancellable(movement: MovementForLifecycle): void {
    this.assert_transition_allowed(movement, 'cancel');

    if (
      movement.source_document_type === 'SaleOrder' ||
      movement.source_document_type === 'DispatchOrder'
    ) {
      throw new DomainBadRequestException({
        code: 'MOVEMENT_MANAGED_BY_DOCUMENT',
        messageKey: 'inventory.movement_managed_by_document',
      });
    }
  }
}
