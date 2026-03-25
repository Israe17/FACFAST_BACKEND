import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { SaleOrderAccessPolicy } from './sale-order-access.policy';

describe('SaleOrderAccessPolicy', () => {
  let policy: SaleOrderAccessPolicy;

  beforeEach(() => {
    policy = new SaleOrderAccessPolicy(new BranchAccessPolicy());
  });

  it('allows users to access orders inside their branch scope', () => {
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

    expect(() =>
      policy.assert_can_access_order(current_user, { branch_id: 2 }),
    ).not.toThrow();
  });

  it('rejects users trying to access orders outside their branch scope', () => {
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

    expect(() =>
      policy.assert_can_access_order(current_user, { branch_id: 3 }),
    ).toThrow(DomainForbiddenException);
  });
});
