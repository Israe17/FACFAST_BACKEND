import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { RoleAccessPolicy } from './role-access.policy';

describe('RoleAccessPolicy', () => {
  let policy: RoleAccessPolicy;

  beforeEach(() => {
    policy = new RoleAccessPolicy();
  });

  it('allows roles in the effective business scope', () => {
    expect(() =>
      policy.assert_can_access_role(
        {
          business_id: 3,
          acting_business_id: null,
          is_platform_admin: false,
          mode: 'tenant',
        } as never,
        { business_id: 3 },
      ),
    ).not.toThrow();
  });

  it('rejects roles outside the effective business scope', () => {
    expect(() =>
      policy.assert_can_access_role(
        {
          business_id: 3,
          acting_business_id: null,
          is_platform_admin: false,
          mode: 'tenant',
        } as never,
        { business_id: 9 },
      ),
    ).toThrow(DomainForbiddenException);
  });
});
