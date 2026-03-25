import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { PlatformContextPolicy } from './platform-context.policy';

describe('PlatformContextPolicy', () => {
  let policy: PlatformContextPolicy;

  beforeEach(() => {
    policy = new PlatformContextPolicy();
  });

  it('rejects inactive businesses for tenant context', () => {
    expect(() =>
      policy.assert_business_can_enter_context({
        id: 8,
        is_active: false,
      }),
    ).toThrow(DomainBadRequestException);
  });

  it('rejects inactive branches for tenant context', () => {
    expect(() =>
      policy.assert_branch_can_enter_context({
        id: 12,
        is_active: false,
      }),
    ).toThrow(DomainBadRequestException);
  });

  it('allows active business and branch context targets', () => {
    expect(() =>
      policy.assert_business_can_enter_context({
        id: 8,
        is_active: true,
      }),
    ).not.toThrow();
    expect(() =>
      policy.assert_branch_can_enter_context({
        id: 12,
        is_active: true,
      }),
    ).not.toThrow();
  });
});
