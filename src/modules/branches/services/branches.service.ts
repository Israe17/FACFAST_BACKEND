import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchView } from '../contracts/branch.view';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { CreateBranchUseCase } from '../use-cases/create-branch.use-case';
import {
  DeleteBranchResult,
  DeleteBranchUseCase,
} from '../use-cases/delete-branch.use-case';
import { GetBranchQueryUseCase } from '../use-cases/get-branch.query.use-case';
import { GetBranchesListQueryUseCase } from '../use-cases/get-branches-list.query.use-case';
import { UpdateBranchUseCase } from '../use-cases/update-branch.use-case';

@Injectable()
export class BranchesService {
  constructor(
    private readonly get_branches_list_query_use_case: GetBranchesListQueryUseCase,
    private readonly create_branch_use_case: CreateBranchUseCase,
    private readonly get_branch_query_use_case: GetBranchQueryUseCase,
    private readonly update_branch_use_case: UpdateBranchUseCase,
    private readonly delete_branch_use_case: DeleteBranchUseCase,
  ) {}

  async get_branches(
    current_user: AuthenticatedUserContext,
  ): Promise<BranchView[]> {
    return this.get_branches_list_query_use_case.execute({ current_user });
  }

  async create_branch(
    current_user: AuthenticatedUserContext,
    dto: CreateBranchDto,
  ): Promise<BranchView> {
    return this.create_branch_use_case.execute({ current_user, dto });
  }

  async get_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): Promise<BranchView> {
    return this.get_branch_query_use_case.execute({ current_user, branch_id });
  }

  async update_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
    dto: UpdateBranchDto,
  ): Promise<BranchView> {
    return this.update_branch_use_case.execute({
      current_user,
      branch_id,
      dto,
    });
  }

  async delete_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): Promise<DeleteBranchResult> {
    return this.delete_branch_use_case.execute({ current_user, branch_id });
  }
}
