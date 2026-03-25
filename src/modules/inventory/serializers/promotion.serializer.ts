import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { PromotionView } from '../contracts/promotion.view';
import { Promotion } from '../entities/promotion.entity';

@Injectable()
export class PromotionSerializer
  implements EntitySerializer<Promotion, PromotionView>
{
  serialize(promotion: Promotion): PromotionView {
    return {
      id: promotion.id,
      code: promotion.code,
      business_id: promotion.business_id,
      name: promotion.name,
      type: promotion.type,
      valid_from: promotion.valid_from,
      valid_to: promotion.valid_to,
      is_active: promotion.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: promotion.is_active,
        can_reactivate: !promotion.is_active,
        reasons: [],
      },
      items:
        promotion.items?.map((item) => ({
          id: item.id,
          product: item.product
            ? {
                id: item.product.id,
                code: item.product.code,
                name: item.product.name,
              }
            : {
                id: item.product_id,
              },
          product_variant: item.product_variant
            ? {
                id: item.product_variant.id,
                sku: item.product_variant.sku,
                variant_name: item.product_variant.variant_name,
                is_default: item.product_variant.is_default,
              }
            : null,
          min_quantity: item.min_quantity,
          discount_value: item.discount_value,
          override_price: item.override_price,
          bonus_quantity: item.bonus_quantity,
        })) ?? [],
      created_at: promotion.created_at,
      updated_at: promotion.updated_at,
    };
  }
}
