import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListLifecyclePolicy } from '../policies/price-list-lifecycle.policy';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { PricingValidationService } from '../services/pricing-validation.service';

export type DeletePriceListCommand = {
  current_user: AuthenticatedUserContext;
  price_list_id: number;
};

export type DeletePriceListResult = {
  id: number;
};

@Injectable()
export class DeletePriceListUseCase
  implements CommandUseCase<DeletePriceListCommand, DeletePriceListResult>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_lifecycle_policy: PriceListLifecyclePolicy,
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly price_lists_repository: PriceListsRepository,
  ) {}

  async execute({
    current_user,
    price_list_id,
  }: DeletePriceListCommand): Promise<DeletePriceListResult> {
    const business_id = resolve_effective_business_id(current_user);
    const price_list =
      await this.pricing_validation_service.get_price_list_in_business(
        business_id,
        price_list_id,
      );

    this.price_list_lifecycle_policy.assert_deletable(price_list);
    await this.product_prices_repository.delete_by_price_list_in_business(
      business_id,
      price_list_id,
    );
    await this.price_lists_repository.remove(price_list);

    return { id: price_list_id };
  }
}
