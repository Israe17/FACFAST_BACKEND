import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListView } from '../contracts/price-list.view';
import { PriceListSerializer } from '../serializers/price-list.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetPriceListQuery = {
  current_user: AuthenticatedUserContext;
  price_list_id: number;
};

@Injectable()
export class GetPriceListQueryUseCase
  implements QueryUseCase<GetPriceListQuery, PriceListView>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_serializer: PriceListSerializer,
  ) {}

  async execute({
    current_user,
    price_list_id,
  }: GetPriceListQuery): Promise<PriceListView> {
    const price_list =
      await this.pricing_validation_service.get_price_list_in_business(
        resolve_effective_business_id(current_user),
        price_list_id,
      );

    return this.price_list_serializer.serialize(price_list);
  }
}
