import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { ContactBranchAssignmentPolicy } from './contact-branch-assignment.policy';

describe('ContactBranchAssignmentPolicy', () => {
  let policy: ContactBranchAssignmentPolicy;

  beforeEach(() => {
    policy = new ContactBranchAssignmentPolicy();
  });

  it('allows platform admins to manage any branch assignment', () => {
    expect(() =>
      policy.assert_account_manager_can_access_branch(
        {
          user_type: 'staff',
          is_platform_admin: true,
          user_branch_access: [],
        },
        9,
      ),
    ).not.toThrow();
  });

  it('rejects account managers outside branch scope', () => {
    expect(() =>
      policy.assert_account_manager_can_access_branch(
        {
          id: 12,
          user_type: 'staff',
          is_platform_admin: false,
          user_branch_access: [{ branch_id: 4 }],
        },
        9,
      ),
    ).toThrow(DomainBadRequestException);
  });

  it('normalizes blank notes to null', () => {
    expect(policy.normalize_optional_string('   ')).toBeNull();
  });
});
