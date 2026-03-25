import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { ElectronicDocumentAccessPolicy } from './electronic-document-access.policy';

describe('ElectronicDocumentAccessPolicy', () => {
  let policy: ElectronicDocumentAccessPolicy;
  let current_user: AuthenticatedUserContext;

  beforeEach(() => {
    policy = new ElectronicDocumentAccessPolicy(new BranchAccessPolicy());
    current_user = {
      id: 9,
      business_id: 1,
      email: 'docs@test.com',
      name: 'Docs',
      roles: ['billing'],
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
  });

  it('allows documents inside the branch scope', () => {
    expect(() =>
      policy.assert_can_access_document(current_user, { branch_id: 4 }),
    ).not.toThrow();
  });

  it('rejects documents outside the branch scope', () => {
    expect(() =>
      policy.assert_can_access_document(current_user, { branch_id: 8 }),
    ).toThrow(DomainForbiddenException);
  });
});
