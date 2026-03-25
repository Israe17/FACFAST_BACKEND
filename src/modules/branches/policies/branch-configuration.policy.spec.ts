import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { BranchConfigurationPolicy } from './branch-configuration.policy';

describe('BranchConfigurationPolicy', () => {
  let policy: BranchConfigurationPolicy;
  let current_user: AuthenticatedUserContext;

  beforeEach(() => {
    policy = new BranchConfigurationPolicy();
    current_user = {
      id: 7,
      business_id: 1,
      email: 'branch@test.com',
      name: 'Branch User',
      roles: ['manager'],
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
  });

  it('rejects sensitive branch configuration changes without permission', () => {
    expect(() =>
      policy.assert_configuration_permissions(current_user, {
        crypto_key: 'secret',
      }),
    ).toThrow(DomainForbiddenException);
  });

  it('allows sensitive configuration changes with permission', () => {
    current_user.permissions = [PermissionKey.BRANCHES_CONFIGURE];

    expect(() =>
      policy.assert_configuration_permissions(current_user, {
        crypto_key: 'secret',
      }),
    ).not.toThrow();
  });
});
