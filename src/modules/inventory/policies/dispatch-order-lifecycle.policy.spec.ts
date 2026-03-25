import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchOrderLifecyclePolicy } from './dispatch-order-lifecycle.policy';

describe('DispatchOrderLifecyclePolicy', () => {
  let policy: DispatchOrderLifecyclePolicy;

  beforeEach(() => {
    policy = new DispatchOrderLifecyclePolicy();
  });

  it('rejects editing dispatched orders', () => {
    expect(() =>
      policy.assert_editable({ status: DispatchOrderStatus.DISPATCHED }),
    ).toThrow(DomainConflictException);
  });

  it('rejects dispatching orders that are not ready', () => {
    expect(() =>
      policy.assert_dispatchable({ status: DispatchOrderStatus.DRAFT }),
    ).toThrow(DomainConflictException);
  });

  it('rejects completing orders that are not in progress', () => {
    expect(() =>
      policy.assert_completable({ status: DispatchOrderStatus.READY }),
    ).toThrow(DomainConflictException);
  });
});
