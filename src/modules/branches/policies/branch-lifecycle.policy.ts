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
  build_lifecycle(
    branch: { is_active: boolean },
    dependencies?: BranchDeleteDependencies,
  ) {
    const has_dependencies =
      dependencies !== undefined &&
      Object.values(dependencies).some((count) => count > 0);

    return {
      can_delete: dependencies ? !has_dependencies : false,
      can_deactivate: branch.is_active,
      can_reactivate: !branch.is_active,
      reasons: dependencies
        ? has_dependencies
          ? ['has_dependencies']
          : []
        : ['delete_requires_dependency_check'],
    };
  }

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
