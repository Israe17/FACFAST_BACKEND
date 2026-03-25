import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { PriceListBranchAssignmentPolicy } from './price-list-branch-assignment.policy';

describe('PriceListBranchAssignmentPolicy', () => {
  let policy: PriceListBranchAssignmentPolicy;

  beforeEach(() => {
    policy = new PriceListBranchAssignmentPolicy();
  });

  it('rejects default assignments that are inactive', () => {
    expect(() =>
      policy.assert_default_requires_active(true, false),
    ).toThrow(DomainBadRequestException);
  });

  it('rejects assigning inactive price lists when the assignment must be active', () => {
    expect(() =>
      policy.assert_price_list_active({ id: 9, is_active: false }, true),
    ).toThrow(DomainBadRequestException);
  });

  it('normalizes blank notes to null', () => {
    expect(policy.normalize_optional_string('   ')).toBeNull();
  });
});
