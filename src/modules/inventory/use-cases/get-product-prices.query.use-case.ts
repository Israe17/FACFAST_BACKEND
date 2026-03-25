import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductPriceView } from '../contracts/product-price.view';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { ProductPriceSerializer } from '../serializers/product-price.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type GetProductPricesQuery = {
  current_user: AuthenticatedUserContext;
  product_id: number;
};

@Injectable()
export class GetProductPricesQueryUseCase
  implements QueryUseCase<GetProductPricesQuery, ProductPriceView[]>
{
  constructor(
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly product_price_serializer: ProductPriceSerializer,
  ) {}

  async execute({
    current_user,
    product_id,
  }: GetProductPricesQuery): Promise<ProductPriceView[]> {
    const business_id = resolve_effective_business_id(current_user);
    await this.inventory_validation_service.get_product_in_business(
      business_id,
      product_id,
    );

    const product_prices =
      await this.product_prices_repository.find_all_by_product_in_business(
        product_id,
        business_id,
      );

    return product_prices.map((product_price) => {
      return this.product_price_serializer.serialize(product_price);
    });
  }
}
