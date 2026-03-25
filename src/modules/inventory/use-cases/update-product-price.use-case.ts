import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductPriceView } from '../contracts/product-price.view';
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';
import { ProductPricePolicy } from '../policies/product-price.policy';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { ProductPriceSerializer } from '../serializers/product-price.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { PricingValidationService } from '../services/pricing-validation.service';
import { ProductVariantsService } from '../services/product-variants.service';

export type UpdateProductPriceCommand = {
  current_user: AuthenticatedUserContext;
  product_price_id: number;
  dto: UpdateProductPriceDto;
};

@Injectable()
export class UpdateProductPriceUseCase
  implements CommandUseCase<UpdateProductPriceCommand, ProductPriceView>
{
  constructor(
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly pricing_validation_service: PricingValidationService,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly product_price_policy: ProductPricePolicy,
    private readonly product_price_serializer: ProductPriceSerializer,
  ) {}

  async execute({
    current_user,
    product_price_id,
    dto,
  }: UpdateProductPriceCommand): Promise<ProductPriceView> {
    const business_id = resolve_effective_business_id(current_user);
    const product_price =
      await this.pricing_validation_service.get_product_price_in_business(
        business_id,
        product_price_id,
      );

    if (dto.product_variant_id !== undefined) {
      if (dto.product_variant_id) {
        const product =
          await this.inventory_validation_service.get_product_in_business(
            business_id,
            product_price.product_id,
            {
              require_active: true,
            },
          );
        const variant =
          await this.product_variants_service.resolve_variant_for_operation(
            business_id,
            product,
            dto.product_variant_id,
          );
        product_price.product_variant_id = variant.id;
      } else {
        product_price.product_variant_id = null;
      }
    }
    if (dto.price_list_id !== undefined) {
      product_price.price_list_id = (
        await this.inventory_validation_service.get_price_list_in_business(
          business_id,
          dto.price_list_id,
          {
            require_active: true,
          },
        )
      ).id;
    }

    const next_valid_from =
      dto.valid_from !== undefined
        ? dto.valid_from
          ? new Date(dto.valid_from)
          : null
        : product_price.valid_from;
    const next_valid_to =
      dto.valid_to !== undefined
        ? dto.valid_to
          ? new Date(dto.valid_to)
          : null
        : product_price.valid_to;

    this.product_price_policy.assert_valid_date_range(
      next_valid_from,
      next_valid_to,
    );

    if (dto.price !== undefined) {
      product_price.price = dto.price;
    }
    if (dto.min_quantity !== undefined) {
      product_price.min_quantity = dto.min_quantity;
    }
    if (dto.valid_from !== undefined) {
      product_price.valid_from = next_valid_from;
    }
    if (dto.valid_to !== undefined) {
      product_price.valid_to = next_valid_to;
    }
    if (dto.is_active !== undefined) {
      product_price.is_active = dto.is_active;
    }

    const saved_product_price =
      await this.product_prices_repository.save(product_price);
    const hydrated_product_price =
      await this.pricing_validation_service.get_product_price_in_business(
        business_id,
        saved_product_price.id,
      );
    return this.product_price_serializer.serialize(hydrated_product_price);
  }
}
