import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { BranchView } from '../contracts/branch.view';
import { BranchLifecyclePolicy } from '../policies/branch-lifecycle.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { BranchSerializer } from '../serializers/branch.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type GetBranchesListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetBranchesListQueryUseCase
  implements QueryUseCase<GetBranchesListQuery, BranchView[]>
{
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly branches_validation_service: BranchesValidationService,
    private readonly branch_lifecycle_policy: BranchLifecyclePolicy,
    private readonly branch_serializer: BranchSerializer,
  ) {}

  async execute({
    current_user,
  }: GetBranchesListQuery): Promise<BranchView[]> {
    const branches = await this.branches_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
      resolve_effective_branch_scope_ids(current_user),
    );

    return Promise.all(
      branches.map(async (branch) => {
        const dependencies =
          await this.branches_validation_service.count_branch_delete_dependencies(
            branch,
          );
        return this.branch_serializer.serialize(
          branch,
          this.branch_lifecycle_policy.build_lifecycle(branch, dependencies),
        );
      }),
    );
  }
}
