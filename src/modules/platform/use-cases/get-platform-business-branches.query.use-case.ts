import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { PlatformBranchView } from '../contracts/platform-branch.view';
import { PlatformBranchSerializer } from '../serializers/platform-branch.serializer';
import { PlatformValidationService } from '../services/platform-validation.service';

export type GetPlatformBusinessBranchesQuery = {
  business_id: number;
};

@Injectable()
export class GetPlatformBusinessBranchesQueryUseCase
  implements
    QueryUseCase<GetPlatformBusinessBranchesQuery, PlatformBranchView[]>
{
  constructor(
    private readonly platform_validation_service: PlatformValidationService,
    private readonly branches_repository: BranchesRepository,
    private readonly platform_branch_serializer: PlatformBranchSerializer,
  ) {}

  async execute({
    business_id,
  }: GetPlatformBusinessBranchesQuery): Promise<PlatformBranchView[]> {
    await this.platform_validation_service.get_business_or_fail(business_id);
    const branches =
      await this.branches_repository.find_all_by_business(business_id);

    return branches.map((branch) =>
      this.platform_branch_serializer.serialize(branch),
    );
  }
}
