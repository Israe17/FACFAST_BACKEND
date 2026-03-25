import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrderLifecyclePolicy } from './sale-order-lifecycle.policy';

describe('SaleOrderLifecyclePolicy', () => {
  let policy: SaleOrderLifecyclePolicy;

  beforeEach(() => {
    policy = new SaleOrderLifecyclePolicy();
  });

  it('rejects confirming orders that are no longer drafts', () => {
    expect(() =>
      policy.assert_confirmable({ status: SaleOrderStatus.CONFIRMED }),
    ).toThrow(DomainConflictException);
  });

  it('rejects editing orders that are no longer drafts', () => {
    expect(() =>
      policy.assert_editable({ status: SaleOrderStatus.CANCELLED }),
    ).toThrow(DomainConflictException);
  });

  it('rejects deleting confirmed orders', () => {
    expect(() =>
      policy.assert_deletable({ status: SaleOrderStatus.CONFIRMED }, 99),
    ).toThrow(DomainBadRequestException);
  });
});
