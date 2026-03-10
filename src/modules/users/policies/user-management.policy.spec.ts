import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { User } from '../entities/user.entity';
import { UserManagementPolicy } from './user-management.policy';

describe('UserManagementPolicy', () => {
  let policy: UserManagementPolicy;

  beforeEach(() => {
    policy = new UserManagementPolicy();
  });

  it('rejects cross-business user management', () => {
    const current_user: AuthenticatedUserContext = {
      id: 10,
      business_id: 1,
      email: 'admin@test.com',
      name: 'Admin',
      roles: ['admin'],
      permissions: [],
      branch_ids: [1],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
    };
    const target_user = {
      business_id: 2,
      user_type: UserType.STAFF,
    } as User;

    expect(() =>
      policy.assert_can_manage_user(current_user, target_user),
    ).toThrow('Cross-business user management is not allowed.');
  });

  it('rejects non-owner management of owner users', () => {
    const current_user: AuthenticatedUserContext = {
      id: 10,
      business_id: 1,
      email: 'admin@test.com',
      name: 'Admin',
      roles: ['admin'],
      permissions: [],
      branch_ids: [1],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
    };
    const target_user = {
      id: 11,
      business_id: 1,
      user_type: UserType.OWNER,
    } as User;

    expect(() =>
      policy.assert_can_manage_user(current_user, target_user),
    ).toThrow('Owner users can only be managed by owners.');
  });
});
