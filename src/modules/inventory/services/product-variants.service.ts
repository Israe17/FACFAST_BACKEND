import { Injectable } from '@nestjs/common';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';

@Injectable()
export class ProductVariantsService {
  constructor(
    private readonly product_variants_repository: ProductVariantsRepository,
  ) {}

  async ensure_default_variant_for_product(
    product: Product,
  ): Promise<ProductVariant> {
    const existing_default_variant =
      await this.product_variants_repository.find_default_by_product_in_business(
        product.business_id,
        product.id,
      );

    const default_sku =
      this.normalize_optional_string(product.sku) ??
      this.build_default_variant_sku(product.id);
    const default_barcode = this.normalize_optional_string(product.barcode);

    if (existing_default_variant) {
      existing_default_variant.sku = default_sku;
      existing_default_variant.barcode = default_barcode;
      existing_default_variant.variant_name = 'Default';
      existing_default_variant.stock_unit_measure_id =
        product.stock_unit_id ?? product.sale_unit_id;
      existing_default_variant.sale_unit_measure_id =
        product.sale_unit_id ?? product.stock_unit_id;
      existing_default_variant.fiscal_profile_id = product.tax_profile_id;
      existing_default_variant.default_warranty_profile_id =
        product.has_warranty ? product.warranty_profile_id : null;
      existing_default_variant.track_inventory = product.track_inventory;
      existing_default_variant.track_lots = product.track_lots;
      existing_default_variant.track_expiration = product.track_expiration;
      existing_default_variant.allow_negative_stock =
        product.allow_negative_stock;
      existing_default_variant.is_active = product.is_active;
      return this.product_variants_repository.save(existing_default_variant);
    }

    return this.product_variants_repository.save(
      this.product_variants_repository.create({
        business_id: product.business_id,
        product_id: product.id,
        sku: default_sku,
        barcode: default_barcode,
        variant_name: 'Default',
        stock_unit_measure_id: product.stock_unit_id ?? product.sale_unit_id,
        sale_unit_measure_id: product.sale_unit_id ?? product.stock_unit_id,
        fiscal_profile_id: product.tax_profile_id,
        default_warranty_profile_id: product.has_warranty
          ? product.warranty_profile_id
          : null,
        is_default: true,
        track_inventory: product.track_inventory,
        track_lots: product.track_lots,
        track_expiration: product.track_expiration,
        allow_negative_stock: product.allow_negative_stock,
        is_active: product.is_active,
      }),
    );
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private build_default_variant_sku(product_id: number): string {
    return `SKU-${product_id.toString().padStart(6, '0')}`;
  }
}
