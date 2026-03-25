import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { RoleLifecyclePolicy } from './role-lifecycle.policy';

describe('RoleLifecyclePolicy', () => {
  let policy: RoleLifecyclePolicy;

  beforeEach(() => {
    policy = new RoleLifecyclePolicy();
  });

  it('rejects deleting system roles', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 7, is_system: true },
        {
          user_assignments: 0,
        },
      ),
    ).toThrow(DomainBadRequestException);
  });

  it('rejects deleting roles still assigned to users', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 7, is_system: false },
        {
          user_assignments: 2,
        },
      ),
    ).toThrow(DomainBadRequestException);
  });

  it('allows deleting custom roles without dependencies', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 7, is_system: false },
        {
          user_assignments: 0,
        },
      ),
    ).not.toThrow();
  });
});
