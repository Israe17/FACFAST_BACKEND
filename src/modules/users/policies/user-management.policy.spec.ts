import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
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
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };
    const target_user = {
      business_id: 2,
      user_type: UserType.STAFF,
    } as User;

    expect(() =>
      policy.assert_can_manage_user(current_user, target_user),
    ).toThrow(DomainForbiddenException);

    try {
      policy.assert_can_manage_user(current_user, target_user);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainForbiddenException);
      expect((error as DomainForbiddenException).getResponse()).toMatchObject({
        code: 'USER_CROSS_BUSINESS_MANAGEMENT_FORBIDDEN',
        messageKey: 'users.cross_business_management_forbidden',
      });
    }
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
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };
    const target_user = {
      id: 11,
      business_id: 1,
      user_type: UserType.OWNER,
    } as User;

    expect(() =>
      policy.assert_can_manage_user(current_user, target_user),
    ).toThrow(DomainForbiddenException);

    try {
      policy.assert_can_manage_user(current_user, target_user);
    } catch (error) {
      expect(error).toBeInstanceOf(DomainForbiddenException);
      expect((error as DomainForbiddenException).getResponse()).toMatchObject({
        code: 'USER_OWNER_MANAGEMENT_FORBIDDEN',
        messageKey: 'users.owner_management_forbidden',
      });
    }
  });
});
