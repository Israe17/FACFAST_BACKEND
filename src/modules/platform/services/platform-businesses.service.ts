import { Injectable } from '@nestjs/common';
import { CreateBusinessOnboardingDto } from '../../businesses/dto/create-business-onboarding.dto';
import { PlatformBranchView } from '../contracts/platform-branch.view';
import { PlatformBusinessView } from '../contracts/platform-business.view';
import { GetPlatformBusinessBranchesQueryUseCase } from '../use-cases/get-platform-business-branches.query.use-case';
import { GetPlatformBusinessQueryUseCase } from '../use-cases/get-platform-business.query.use-case';
import { GetPlatformBusinessesListQueryUseCase } from '../use-cases/get-platform-businesses-list.query.use-case';
import { OnboardPlatformBusinessUseCase } from '../use-cases/onboard-platform-business.use-case';

@Injectable()
export class PlatformBusinessesService {
  constructor(
    private readonly get_platform_businesses_list_query_use_case: GetPlatformBusinessesListQueryUseCase,
    private readonly get_platform_business_query_use_case: GetPlatformBusinessQueryUseCase,
    private readonly get_platform_business_branches_query_use_case: GetPlatformBusinessBranchesQueryUseCase,
    private readonly onboard_platform_business_use_case: OnboardPlatformBusinessUseCase,
  ) {}

  async get_businesses(): Promise<PlatformBusinessView[]> {
    return this.get_platform_businesses_list_query_use_case.execute();
  }

  async get_business(business_id: number): Promise<PlatformBusinessView> {
    return this.get_platform_business_query_use_case.execute({ business_id });
  }

  async get_business_branches(
    business_id: number,
  ): Promise<PlatformBranchView[]> {
    return this.get_platform_business_branches_query_use_case.execute({
      business_id,
    });
  }

  async onboard_business(dto: CreateBusinessOnboardingDto): Promise<unknown> {
    return this.onboard_platform_business_use_case.execute({ dto });
  }
}
