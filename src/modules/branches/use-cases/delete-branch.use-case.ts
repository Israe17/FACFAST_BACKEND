import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchLifecyclePolicy } from '../policies/branch-lifecycle.policy';
import { BranchesRepository } from '../repositories/branches.repository';
import { BranchesValidationService } from '../services/branches-validation.service';

export type DeleteBranchCommand = {
  current_user: AuthenticatedUserContext;
  branch_id: number;
};

export type DeleteBranchResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeleteBranchUseCase
  implements CommandUseCase<DeleteBranchCommand, DeleteBranchResult>
{
  constructor(
    private readonly branches_validation_service: BranchesValidationService,
    private readonly branch_lifecycle_policy: BranchLifecyclePolicy,
    private readonly branches_repository: BranchesRepository,
  ) {}

  async execute({
    current_user,
    branch_id,
  }: DeleteBranchCommand): Promise<DeleteBranchResult> {
    const branch = await this.branches_validation_service.get_branch_for_access(
      current_user,
      branch_id,
    );
    const dependencies =
      await this.branches_validation_service.count_branch_delete_dependencies(
        branch,
      );

    this.branch_lifecycle_policy.assert_deletable(branch, dependencies);
    await this.branches_repository.remove(branch);
    return {
      id: branch_id,
      deleted: true,
    };
  }
}
