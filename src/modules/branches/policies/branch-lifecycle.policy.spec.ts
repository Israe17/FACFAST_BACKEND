import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { BranchLifecyclePolicy } from './branch-lifecycle.policy';

describe('BranchLifecyclePolicy', () => {
  let policy: BranchLifecyclePolicy;

  beforeEach(() => {
    policy = new BranchLifecyclePolicy();
  });

  it('rejects deleting branches with dependencies', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 2 },
        {
          warehouses: 1,
          warehouse_locations: 0,
          warehouse_stock: 0,
          warehouse_branch_links: 0,
          inventory_lots: 0,
          inventory_movement_headers: 0,
          inventory_movements: 0,
        },
      ),
    ).toThrow(DomainBadRequestException);
  });

  it('allows deleting branches without dependencies', () => {
    expect(() =>
      policy.assert_deletable(
        { id: 2 },
        {
          warehouses: 0,
          warehouse_locations: 0,
          warehouse_stock: 0,
          warehouse_branch_links: 0,
          inventory_lots: 0,
          inventory_movement_headers: 0,
          inventory_movements: 0,
        },
      ),
    ).not.toThrow();
  });
});
