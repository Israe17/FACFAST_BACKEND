import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { InventoryMovementAccessPolicy } from './inventory-movement-access.policy';

describe('InventoryMovementAccessPolicy', () => {
  let policy: InventoryMovementAccessPolicy;
  let current_user: AuthenticatedUserContext;

  beforeEach(() => {
    policy = new InventoryMovementAccessPolicy(new BranchAccessPolicy());
    current_user = {
      id: 7,
      business_id: 1,
      email: 'inventory@test.com',
      name: 'Inventory',
      roles: ['inventory'],
      permissions: [],
      branch_ids: [2, 3],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };
  });

  it('allows access to global movements without branch binding', () => {
    expect(() =>
      policy.assert_can_access_header(current_user, { branch_id: null }),
    ).not.toThrow();
  });

  it('rejects movements outside the branch scope', () => {
    expect(() =>
      policy.assert_can_access_header(current_user, { branch_id: 9 }),
    ).toThrow(DomainForbiddenException);
  });
});
