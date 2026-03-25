import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { ProductView } from '../contracts/product.view';
import { Product } from '../entities/product.entity';

@Injectable()
export class ProductSerializer implements EntitySerializer<Product, ProductView> {
  serialize(product: Product): ProductView {
    return {
      id: product.id,
      code: product.code,
      business_id: product.business_id,
      type: product.type,
      name: product.name,
      description: product.description,
      category: product.category
        ? {
            id: product.category.id,
            code: product.category.code,
            name: product.category.name,
          }
        : null,
      brand: product.brand
        ? {
            id: product.brand.id,
            code: product.brand.code,
            name: product.brand.name,
          }
        : null,
      sku: product.sku,
      barcode: product.barcode,
      stock_unit: product.stock_unit
        ? {
            id: product.stock_unit.id,
            code: product.stock_unit.code,
            name: product.stock_unit.name,
            symbol: product.stock_unit.symbol,
          }
        : null,
      sale_unit: product.sale_unit
        ? {
            id: product.sale_unit.id,
            code: product.sale_unit.code,
            name: product.sale_unit.name,
            symbol: product.sale_unit.symbol,
          }
        : null,
      tax_profile: product.tax_profile
        ? {
            id: product.tax_profile.id,
            code: product.tax_profile.code,
            name: product.tax_profile.name,
            item_kind: product.tax_profile.item_kind,
            tax_type: product.tax_profile.tax_type,
            cabys_code: product.tax_profile.cabys_code,
          }
        : null,
      track_inventory: product.track_inventory,
      track_lots: product.track_lots,
      track_expiration: product.track_expiration,
      track_serials: product.track_serials,
      allow_negative_stock: product.allow_negative_stock,
      has_variants: product.has_variants,
      has_warranty: product.has_warranty,
      warranty_profile: product.warranty_profile
        ? {
            id: product.warranty_profile.id,
            code: product.warranty_profile.code,
            name: product.warranty_profile.name,
          }
        : null,
      variants: (product.variants ?? []).map((variant) => ({
        id: variant.id,
        sku: variant.sku,
        barcode: variant.barcode,
        variant_name: variant.variant_name ?? variant.sku ?? '',
        is_default: variant.is_default,
        is_active: variant.is_active,
        track_serials: variant.track_serials,
        track_inventory: variant.track_inventory,
        allow_negative_stock: variant.allow_negative_stock,
      })),
      is_active: product.is_active,
      lifecycle: {
        can_delete: false,
        can_deactivate: product.is_active,
        can_reactivate: !product.is_active,
        reasons: ['hard_delete_not_supported'],
      },
      created_at: product.created_at,
      updated_at: product.updated_at,
    };
  }
}
