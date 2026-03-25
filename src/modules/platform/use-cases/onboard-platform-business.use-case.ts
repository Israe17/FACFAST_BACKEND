import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { CreateBusinessOnboardingDto } from '../../businesses/dto/create-business-onboarding.dto';
import { BusinessOnboardingService } from '../../businesses/services/business-onboarding.service';

export type OnboardPlatformBusinessCommand = {
  dto: CreateBusinessOnboardingDto;
};

@Injectable()
export class OnboardPlatformBusinessUseCase
  implements CommandUseCase<OnboardPlatformBusinessCommand, unknown>
{
  constructor(
    private readonly business_onboarding_service: BusinessOnboardingService,
  ) {}

  async execute({ dto }: OnboardPlatformBusinessCommand): Promise<unknown> {
    return this.business_onboarding_service.onboard_business(dto);
  }
}
