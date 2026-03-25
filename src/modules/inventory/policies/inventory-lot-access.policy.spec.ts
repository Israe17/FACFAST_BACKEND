import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { InventoryLotAccessPolicy } from './inventory-lot-access.policy';

describe('InventoryLotAccessPolicy', () => {
  let policy: InventoryLotAccessPolicy;
  let current_user: AuthenticatedUserContext;

  beforeEach(() => {
    policy = new InventoryLotAccessPolicy(new BranchAccessPolicy());
    current_user = {
      id: 11,
      business_id: 1,
      email: 'lots@test.com',
      name: 'Lots',
      roles: ['inventory'],
      permissions: [],
      branch_ids: [5],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };
  });

  it('allows lots inside the branch scope', () => {
    expect(() =>
      policy.assert_can_access_lot(current_user, { branch_id: 5 }),
    ).not.toThrow();
  });

  it('rejects lots outside the branch scope', () => {
    expect(() =>
      policy.assert_can_access_lot(current_user, { branch_id: 8 }),
    ).toThrow(DomainForbiddenException);
  });
});
