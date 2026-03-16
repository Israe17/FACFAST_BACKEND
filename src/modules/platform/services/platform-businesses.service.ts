import { Injectable } from '@nestjs/common';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { serialize_branch } from '../../branches/utils/serialize-branch.util';
import { CreateBusinessOnboardingDto } from '../../businesses/dto/create-business-onboarding.dto';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { BusinessOnboardingService } from '../../businesses/services/business-onboarding.service';
import { serialize_business } from '../../businesses/utils/serialize-business.util';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';

@Injectable()
export class PlatformBusinessesService {
  constructor(
    private readonly businesses_repository: BusinessesRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly business_onboarding_service: BusinessOnboardingService,
  ) {}

  async get_businesses() {
    const businesses = await this.businesses_repository.find_all();
    return businesses.map((business) => serialize_business(business));
  }

  async get_business(business_id: number) {
    const business = await this.businesses_repository.find_by_id(business_id);
    if (!business) {
      throw new DomainNotFoundException({
        code: 'PLATFORM_BUSINESS_NOT_FOUND',
        messageKey: 'platform.business_not_found',
        details: {
          business_id,
        },
      });
    }

    return serialize_business(business);
  }

  async get_business_branches(business_id: number) {
    await this.assert_business_exists(business_id);
    const branches =
      await this.branches_repository.find_all_by_business(business_id);
    return branches.map((branch) => serialize_branch(branch));
  }

  async onboard_business(dto: CreateBusinessOnboardingDto) {
    return this.business_onboarding_service.onboard_business(dto);
  }

  private async assert_business_exists(business_id: number): Promise<void> {
    const business = await this.businesses_repository.find_by_id(business_id);
    if (!business) {
      throw new DomainNotFoundException({
        code: 'PLATFORM_BUSINESS_NOT_FOUND',
        messageKey: 'platform.business_not_found',
        details: {
          business_id,
        },
      });
    }
  }
}
