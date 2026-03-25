import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { InventoryMovementStatus } from '../enums/inventory-movement-status.enum';
import { InventoryMovementLifecyclePolicy } from './inventory-movement-lifecycle.policy';

describe('InventoryMovementLifecyclePolicy', () => {
  let policy: InventoryMovementLifecyclePolicy;

  beforeEach(() => {
    policy = new InventoryMovementLifecyclePolicy();
  });

  it('rejects cancelling already cancelled movements', () => {
    expect(() =>
      policy.assert_cancellable({
        status: InventoryMovementStatus.CANCELLED,
      }),
    ).toThrow(DomainConflictException);
  });

  it('rejects cancelling movements that are not posted', () => {
    expect(() =>
      policy.assert_cancellable({
        status: InventoryMovementStatus.DRAFT,
      }),
    ).toThrow(DomainBadRequestException);
  });
});
