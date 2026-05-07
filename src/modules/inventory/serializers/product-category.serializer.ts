import { Injectable } from '@nestjs/common';
import { ProductCategoryView } from '../contracts/product-category.view';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class ProductCategorySerializer {
  serialize(category: ProductCategory): ProductCategoryView {
    return {
      id: category.id,
      code: category.code,
      business_id: category.business_id,
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      level: category.level,
      path: category.path,
      default_tax_profile_id: category.default_tax_profile_id,
      default_tax_profile: category.default_tax_profile
        ? {
            id: category.default_tax_profile.id,
            name: category.default_tax_profile.name,
            cabys_code: category.default_tax_profile.cabys_code,
            description: category.default_tax_profile.description,
            iva_rate: category.default_tax_profile.iva_rate,
            item_kind: category.default_tax_profile.item_kind,
          }
        : null,
      is_active: category.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: category.is_active,
        can_reactivate: !category.is_active,
        reasons: [],
      },
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }
}
