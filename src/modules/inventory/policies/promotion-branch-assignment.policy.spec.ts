import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { PromotionBranchAssignmentPolicy } from './promotion-branch-assignment.policy';

describe('PromotionBranchAssignmentPolicy', () => {
  let policy: PromotionBranchAssignmentPolicy;

  beforeEach(() => {
    policy = new PromotionBranchAssignmentPolicy();
  });

  it('rejects activating assignments for inactive promotions', () => {
    expect(() =>
      policy.assert_promotion_active({ id: 5, is_active: false }, true),
    ).toThrow(DomainBadRequestException);
  });

  it('normalizes blank notes to null', () => {
    expect(policy.normalize_optional_string('   ')).toBeNull();
  });
});
