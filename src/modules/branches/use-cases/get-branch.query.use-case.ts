import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchView } from '../contracts/branch.view';
import { BranchSerializer } from '../serializers/branch.serializer';
import { BranchesValidationService } from '../services/branches-validation.service';

export type GetBranchQuery = {
  current_user: AuthenticatedUserContext;
  branch_id: number;
};

@Injectable()
export class GetBranchQueryUseCase
  implements QueryUseCase<GetBranchQuery, BranchView>
{
  constructor(
    private readonly branches_validation_service: BranchesValidationService,
    private readonly branch_serializer: BranchSerializer,
  ) {}

  async execute({
    current_user,
    branch_id,
  }: GetBranchQuery): Promise<BranchView> {
    const branch = await this.branches_validation_service.get_branch_for_access(
      current_user,
      branch_id,
    );

    return this.branch_serializer.serialize(branch);
  }
}
