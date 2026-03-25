import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { PlatformBusinessView } from '../contracts/platform-business.view';
import { PlatformBusinessSerializer } from '../serializers/platform-business.serializer';
import { PlatformValidationService } from '../services/platform-validation.service';

export type GetPlatformBusinessQuery = {
  business_id: number;
};

@Injectable()
export class GetPlatformBusinessQueryUseCase
  implements QueryUseCase<GetPlatformBusinessQuery, PlatformBusinessView>
{
  constructor(
    private readonly platform_validation_service: PlatformValidationService,
    private readonly platform_business_serializer: PlatformBusinessSerializer,
  ) {}

  async execute({
    business_id,
  }: GetPlatformBusinessQuery): Promise<PlatformBusinessView> {
    const business =
      await this.platform_validation_service.get_business_or_fail(business_id);
    return this.platform_business_serializer.serialize(business);
  }
}
