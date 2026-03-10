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
    };

    expect(() => policy.assert_can_access_branch(current_user, 3)).toThrow(
      'The user does not have access to this branch.',
    );
  });
});
