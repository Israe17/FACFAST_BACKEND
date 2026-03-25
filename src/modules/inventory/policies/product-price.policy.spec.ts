import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { ProductPricePolicy } from './product-price.policy';

describe('ProductPricePolicy', () => {
  let policy: ProductPricePolicy;

  beforeEach(() => {
    policy = new ProductPricePolicy();
  });

  it('rejects inverted date ranges', () => {
    expect(() =>
      policy.assert_valid_date_range(
        '2026-03-31T23:59:59.000Z',
        '2026-03-01T00:00:00.000Z',
      ),
    ).toThrow(DomainBadRequestException);
  });

  it('allows open or ascending date ranges', () => {
    expect(() =>
      policy.assert_valid_date_range(
        '2026-03-01T00:00:00.000Z',
        '2026-03-31T23:59:59.000Z',
      ),
    ).not.toThrow();
    expect(() => policy.assert_valid_date_range(null, null)).not.toThrow();
  });
});
