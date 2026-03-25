import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { DispatchOrderAccessPolicy } from './dispatch-order-access.policy';

describe('DispatchOrderAccessPolicy', () => {
  let policy: DispatchOrderAccessPolicy;

  beforeEach(() => {
    policy = new DispatchOrderAccessPolicy(new BranchAccessPolicy());
  });

  it('allows users to access dispatch orders inside their branch scope', () => {
    const current_user: AuthenticatedUserContext = {
      id: 3,
      business_id: 1,
      email: 'dispatch@test.com',
      name: 'Dispatch',
      roles: ['dispatcher'],
      permissions: [],
      branch_ids: [4, 5],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };

    expect(() =>
      policy.assert_can_access_order(current_user, { branch_id: 5 }),
    ).not.toThrow();
  });

  it('rejects users trying to access dispatch orders outside their scope', () => {
    const current_user: AuthenticatedUserContext = {
      id: 3,
      business_id: 1,
      email: 'dispatch@test.com',
      name: 'Dispatch',
      roles: ['dispatcher'],
      permissions: [],
      branch_ids: [4, 5],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    };

    expect(() =>
      policy.assert_can_access_order(current_user, { branch_id: 8 }),
    ).toThrow(DomainForbiddenException);
  });
});
