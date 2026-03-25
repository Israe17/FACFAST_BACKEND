import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { CreatePromotionItemDto } from '../dto/create-promotion-item.dto';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { PromotionType } from '../enums/promotion-type.enum';
import { InventoryValidationService } from '../services/inventory-validation.service';

type NormalizedPromotionItem = CreatePromotionItemDto & {
  product_id: number;
  product_variant_id: number | null;
};

@Injectable()
export class PromotionDefinitionPolicy {
  constructor(
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async normalize_promotion_items(
    business_id: number,
    type: PromotionType,
    items: CreatePromotionItemDto[],
  ): Promise<NormalizedPromotionItem[]> {
    const normalized_items: NormalizedPromotionItem[] = [];
    const target_keys = new Set<string>();

    for (const item of items) {
      const has_product_id =
        item.product_id !== undefined && item.product_id !== null;
      const has_variant_id =
        item.product_variant_id !== undefined &&
        item.product_variant_id !== null;
      if (!has_product_id && !has_variant_id) {
        throw new DomainBadRequestException({
          code: 'PROMOTION_PRODUCT_OR_VARIANT_REQUIRED',
          messageKey: 'inventory.promotion_product_or_variant_required',
          details: {
            field: 'items',
          },
        });
      }

      let product_id = item.product_id ?? null;
      const product_variant_id = item.product_variant_id ?? null;

      if (product_variant_id !== null) {
        const variant =
          await this.product_variants_repository.find_by_id_in_business(
            product_variant_id,
            business_id,
          );
        if (!variant || !variant.product) {
          throw new DomainBadRequestException({
            code: 'PROMOTION_ITEMS_OUTSIDE_BUSINESS',
            messageKey: 'inventory.promotion_items_outside_business',
            details: {
              field: 'items',
            },
          });
        }

        this.inventory_validation_service.assert_product_is_active(
          variant.product,
        );
        this.inventory_validation_service.assert_variant_is_active(variant);

        if (product_id !== null && product_id !== variant.product_id) {
          throw new DomainBadRequestException({
            code: 'VARIANT_PRODUCT_MISMATCH',
            messageKey: 'inventory.variant_product_mismatch',
            details: {
              product_id,
              product_variant_id,
            },
          });
        }

        product_id = variant.product_id;
      } else if (product_id !== null) {
        await this.inventory_validation_service.get_product_in_business(
          business_id,
          product_id,
          {
            require_active: true,
          },
        );
      }

      this.assert_item_shape(type, item);

      const key =
        product_variant_id !== null
          ? `variant:${product_variant_id}`
          : `product:${product_id}`;
      if (target_keys.has(key)) {
        throw new DomainBadRequestException({
          code: 'PROMOTION_DUPLICATE_ITEMS',
          messageKey: 'inventory.promotion_duplicate_items',
          details: {
            field: 'items',
          },
        });
      }
      target_keys.add(key);

      normalized_items.push({
        ...item,
        product_id: product_id!,
        product_variant_id,
      });
    }

    if (normalized_items.length !== items.length) {
      throw new DomainBadRequestException({
        code: 'PROMOTION_ITEMS_OUTSIDE_BUSINESS',
        messageKey: 'inventory.promotion_items_outside_business',
        details: {
          field: 'items',
        },
      });
    }

    return normalized_items;
  }

  assert_valid_date_range(valid_from: string | Date, valid_to: string | Date): void {
    const from = valid_from instanceof Date ? valid_from : new Date(valid_from);
    const to = valid_to instanceof Date ? valid_to : new Date(valid_to);
    if (to < from) {
      throw new DomainBadRequestException({
        code: 'PROMOTION_DATE_RANGE_INVALID',
        messageKey: 'inventory.promotion_date_range_invalid',
        details: {
          field: 'valid_to',
        },
      });
    }
  }

  private assert_item_shape(
    type: PromotionType,
    item: CreatePromotionItemDto,
  ): void {
    if (
      type === PromotionType.PERCENTAGE ||
      type === PromotionType.FIXED_AMOUNT
    ) {
      if (item.discount_value === undefined || item.discount_value === null) {
        throw new DomainBadRequestException({
          code: 'PROMOTION_DISCOUNT_VALUE_REQUIRED',
          messageKey: 'inventory.promotion_discount_value_required',
          details: {
            field: 'items.discount_value',
          },
        });
      }
      return;
    }

    if (type === PromotionType.PRICE_OVERRIDE) {
      if (item.override_price === undefined || item.override_price === null) {
        throw new DomainBadRequestException({
          code: 'PROMOTION_OVERRIDE_PRICE_REQUIRED',
          messageKey: 'inventory.promotion_override_price_required',
          details: {
            field: 'items.override_price',
          },
        });
      }
      return;
    }

    if (type === PromotionType.BUY_X_GET_Y) {
      if (
        item.min_quantity === undefined ||
        item.min_quantity === null ||
        item.bonus_quantity === undefined ||
        item.bonus_quantity === null
      ) {
        throw new DomainBadRequestException({
          code: 'PROMOTION_BUY_X_GET_Y_FIELDS_REQUIRED',
          messageKey: 'inventory.promotion_buy_x_get_y_fields_required',
          details: {
            field: 'items',
          },
        });
      }
    }
  }
}
