import { Injectable } from '@nestjs/common';
import { TransitionPolicy } from '../../common/application/interfaces/transition-policy.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { InventoryMovementStatus } from '../enums/inventory-movement-status.enum';

@Injectable()
export class InventoryMovementLifecyclePolicy
  implements
    TransitionPolicy<{ status: InventoryMovementStatus }, 'cancel'>
{
  assert_transition_allowed(
    movement: { status: InventoryMovementStatus },
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

  assert_cancellable(movement: { status: InventoryMovementStatus }): void {
    this.assert_transition_allowed(movement, 'cancel');
  }
}
