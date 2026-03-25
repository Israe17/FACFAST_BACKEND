import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

type BranchDeleteDependencies = {
  warehouses: number;
  warehouse_locations: number;
  warehouse_stock: number;
  warehouse_branch_links: number;
  inventory_lots: number;
  inventory_movement_headers: number;
  inventory_movements: number;
};

@Injectable()
export class BranchLifecyclePolicy {
  assert_deletable(
    branch: { id: number },
    dependencies: BranchDeleteDependencies,
  ): void {
    if (Object.values(dependencies).some((count) => count > 0)) {
      throw new DomainBadRequestException({
        code: 'BRANCH_DELETE_FORBIDDEN',
        messageKey: 'branches.delete_forbidden',
        details: {
          branch_id: branch.id,
          dependencies,
        },
      });
    }
  }
}
