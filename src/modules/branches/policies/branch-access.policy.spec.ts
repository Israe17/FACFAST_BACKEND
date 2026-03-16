import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from './branch-access.policy';

describe('BranchAccessPolicy', () => {
  let policy: BranchAccessPolicy;

  beforeEach(() => {
    policy = new BranchAccessPolicy();
  });

  it('allows owner users to bypass branch restrictions', () => {
    const current_user: AuthenticatedUserContext = {
      id: 1,
      business_id: 1,
      email: 'owner@test.com',
      name: 'Owner',
      roles: ['owner'],
      permissions: [],
      branch_ids: [],
      max_sale_discount: 100,
      user_type: UserType.OWNER,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };

    expect(() =>
      policy.assert_can_access_branch(current_user, 999),
    ).not.toThrow();
  });

  it('rejects access to non-assigned branches for staff users', () => {
    const current_user: AuthenticatedUserContext = {
      id: 2,
      business_id: 1,
      email: 'staff@test.com',
      name: 'Staff',
      roles: ['branch_manager'],
      permissions: [],
      branch_ids: [1, 2],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };

    expect(() => policy.assert_can_access_branch(current_user, 3)).toThrow(
      DomainForbiddenException,
    );

    try {
      policy.assert_can_access_branch(current_user, 3);
    } catch (error) {
      const response = (error as DomainForbiddenException).getResponse() as {
        code: string;
        messageKey: string;
        details: Record<string, unknown>;
      };

      expect(response.code).toBe('BRANCH_ACCESS_FORBIDDEN');
      expect(response.messageKey).toBe('branches.access_forbidden');
      expect(response.details).toEqual({
        branch_id: 3,
      });
    }
  });
});
