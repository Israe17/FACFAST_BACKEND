import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { ProductPriceView } from '../contracts/product-price.view';
import { ProductPrice } from '../entities/product-price.entity';

@Injectable()
export class ProductPriceSerializer
  implements EntitySerializer<ProductPrice, ProductPriceView>
{
  serialize(product_price: ProductPrice): ProductPriceView {
    return {
      id: product_price.id,
      business_id: product_price.business_id,
      product_id: product_price.product_id,
      product_variant_id: product_price.product_variant_id,
      product_variant: product_price.product_variant
        ? {
            id: product_price.product_variant.id,
            sku: product_price.product_variant.sku,
            variant_name: product_price.product_variant.variant_name,
            is_default: product_price.product_variant.is_default,
          }
        : null,
      price_list_id: product_price.price_list_id,
      price_list: product_price.price_list
        ? {
            id: product_price.price_list.id,
            code: product_price.price_list.code,
            name: product_price.price_list.name,
            kind: product_price.price_list.kind,
            currency: product_price.price_list.currency,
          }
        : null,
      price: product_price.price,
      min_quantity: product_price.min_quantity,
      valid_from: product_price.valid_from,
      valid_to: product_price.valid_to,
      is_active: product_price.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: product_price.is_active,
        can_reactivate: !product_price.is_active,
        reasons: [],
      },
      created_at: product_price.created_at,
      updated_at: product_price.updated_at,
    };
  }
}
