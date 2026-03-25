import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { PricingValidationService } from '../services/pricing-validation.service';

export type DeleteProductPriceCommand = {
  current_user: AuthenticatedUserContext;
  product_price_id: number;
};

export type DeleteProductPriceResult = {
  id: number;
};

@Injectable()
export class DeleteProductPriceUseCase
  implements CommandUseCase<DeleteProductPriceCommand, DeleteProductPriceResult>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly product_prices_repository: ProductPricesRepository,
  ) {}

  async execute({
    current_user,
    product_price_id,
  }: DeleteProductPriceCommand): Promise<DeleteProductPriceResult> {
    const product_price =
      await this.pricing_validation_service.get_product_price_in_business(
        resolve_effective_business_id(current_user),
        product_price_id,
      );
    await this.product_prices_repository.remove(product_price);
    return { id: product_price_id };
  }
}
