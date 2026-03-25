import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { PlatformBusinessView } from '../contracts/platform-business.view';
import { PlatformBusinessSerializer } from '../serializers/platform-business.serializer';

@Injectable()
export class GetPlatformBusinessesListQueryUseCase
  implements QueryUseCase<void, PlatformBusinessView[]>
{
  constructor(
    private readonly businesses_repository: BusinessesRepository,
    private readonly platform_business_serializer: PlatformBusinessSerializer,
  ) {}

  async execute(): Promise<PlatformBusinessView[]> {
    const businesses = await this.businesses_repository.find_all();
    return businesses.map((business) =>
      this.platform_business_serializer.serialize(business),
    );
  }
}
