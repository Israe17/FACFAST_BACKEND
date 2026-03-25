import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductPriceView } from '../contracts/product-price.view';
import { ProductPriceSerializer } from '../serializers/product-price.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetProductPriceQuery = {
  current_user: AuthenticatedUserContext;
  product_price_id: number;
};

@Injectable()
export class GetProductPriceQueryUseCase
  implements QueryUseCase<GetProductPriceQuery, ProductPriceView>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly product_price_serializer: ProductPriceSerializer,
  ) {}

  async execute({
    current_user,
    product_price_id,
  }: GetProductPriceQuery): Promise<ProductPriceView> {
    const product_price =
      await this.pricing_validation_service.get_product_price_in_business(
        resolve_effective_business_id(current_user),
        product_price_id,
      );

    return this.product_price_serializer.serialize(product_price);
  }
}
