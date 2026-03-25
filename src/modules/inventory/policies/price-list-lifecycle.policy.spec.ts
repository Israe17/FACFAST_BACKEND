import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { PriceListLifecyclePolicy } from './price-list-lifecycle.policy';

describe('PriceListLifecyclePolicy', () => {
  let policy: PriceListLifecyclePolicy;

  beforeEach(() => {
    policy = new PriceListLifecyclePolicy();
  });

  it('rejects deleting the default price list', () => {
    expect(() =>
      policy.assert_deletable({
        id: 4,
        is_default: true,
      }),
    ).toThrow(DomainBadRequestException);
  });

  it('allows deleting non-default price lists', () => {
    expect(() =>
      policy.assert_deletable({
        id: 7,
        is_default: false,
      }),
    ).not.toThrow();
  });
});
