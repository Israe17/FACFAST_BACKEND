import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductPriceView } from '../contracts/product-price.view';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';
import { ProductPricePolicy } from '../policies/product-price.policy';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { ProductPriceSerializer } from '../serializers/product-price.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { PricingValidationService } from '../services/pricing-validation.service';
import { ProductVariantsService } from '../services/product-variants.service';

export type CreateProductPriceCommand = {
  current_user: AuthenticatedUserContext;
  product_id: number;
  dto: CreateProductPriceDto;
};

@Injectable()
export class CreateProductPriceUseCase
  implements CommandUseCase<CreateProductPriceCommand, ProductPriceView>
{
  constructor(
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly pricing_validation_service: PricingValidationService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly product_price_policy: ProductPricePolicy,
    private readonly product_price_serializer: ProductPriceSerializer,
  ) {}

  async execute({
    current_user,
    product_id,
    dto,
  }: CreateProductPriceCommand): Promise<ProductPriceView> {
    const business_id = resolve_effective_business_id(current_user);
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        product_id,
        {
          require_active: true,
        },
      );
    const price_list =
      await this.inventory_validation_service.get_price_list_in_business(
        business_id,
        dto.price_list_id,
        {
          require_active: true,
        },
      );

    let resolved_variant_id: number | null = null;
    if (dto.product_variant_id) {
      const variant =
        await this.product_variants_service.resolve_variant_for_operation(
          business_id,
          product,
          dto.product_variant_id,
        );
      resolved_variant_id = variant.id;
    }

    this.product_price_policy.assert_valid_date_range(
      dto.valid_from,
      dto.valid_to,
    );

    const saved_product_price = await this.product_prices_repository.save(
      this.product_prices_repository.create({
        business_id,
        product_id: product.id,
        product_variant_id: resolved_variant_id,
        price_list_id: price_list.id,
        price: dto.price,
        min_quantity: dto.min_quantity ?? null,
        valid_from: dto.valid_from ? new Date(dto.valid_from) : null,
        valid_to: dto.valid_to ? new Date(dto.valid_to) : null,
        is_active: dto.is_active ?? true,
      }),
    );

    const hydrated_product_price =
      await this.pricing_validation_service.get_product_price_in_business(
        business_id,
        saved_product_price.id,
      );
    return this.product_price_serializer.serialize(hydrated_product_price);
  }
}
