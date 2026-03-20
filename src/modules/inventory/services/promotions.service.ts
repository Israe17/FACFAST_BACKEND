import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreatePromotionItemDto } from '../dto/create-promotion-item.dto';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { Promotion } from '../entities/promotion.entity';
import { PromotionType } from '../enums/promotion-type.enum';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly promotions_repository: PromotionsRepository,
    private readonly products_repository: ProductsRepository,
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_promotions(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const promotions =
      await this.promotions_repository.find_all_by_business(business_id);
    return promotions.map((promotion) => this.serialize_promotion(promotion));
  }

  async create_promotion(
    current_user: AuthenticatedUserContext,
    dto: CreatePromotionDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    if (
      await this.promotions_repository.exists_name_in_business(
        business_id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'PROMOTION_NAME_DUPLICATE',
        messageKey: 'inventory.promotion_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PN', dto.code);
    }
    this.assert_valid_date_range(dto.valid_from, dto.valid_to);

    const normalized_items = await this.normalize_promotion_items(
      business_id,
      dto.type,
      dto.items ?? [],
    );

    const promotion = await this.promotions_repository.save(
      this.promotions_repository.create({
        business_id,
        code: dto.code?.trim() ?? null,
        name: dto.name.trim(),
        type: dto.type,
        valid_from: new Date(dto.valid_from),
        valid_to: new Date(dto.valid_to),
        is_active: dto.is_active ?? true,
      }),
    );

    if (dto.items?.length) {
      await this.promotions_repository.replace_items(
        promotion.id,
        normalized_items.map((item) => ({
          promotion_id: promotion.id,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          min_quantity: item.min_quantity ?? null,
          discount_value: item.discount_value ?? null,
          override_price: item.override_price ?? null,
          bonus_quantity: item.bonus_quantity ?? null,
        })),
      );
    }

    const hydrated = await this.promotions_repository.find_by_id_in_business(
      promotion.id,
      business_id,
    );
    if (!hydrated) {
      throw new DomainNotFoundException({
        code: 'PROMOTION_NOT_FOUND',
        messageKey: 'inventory.promotion_not_found',
        details: {
          promotion_id: promotion.id,
        },
      });
    }

    return this.serialize_promotion(hydrated);
  }

  async get_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ) {
    return this.serialize_promotion(
      await this.get_promotion_entity(
        resolve_effective_business_id(current_user),
        promotion_id,
      ),
    );
  }

  async update_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    dto: UpdatePromotionDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const promotion = await this.get_promotion_entity(
      business_id,
      promotion_id,
    );

    const next_name = dto.name?.trim() ?? promotion.name;
    if (
      await this.promotions_repository.exists_name_in_business(
        business_id,
        next_name,
        promotion.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'PROMOTION_NAME_DUPLICATE',
        messageKey: 'inventory.promotion_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    const next_type = dto.type ?? promotion.type;
    const next_valid_from = dto.valid_from
      ? new Date(dto.valid_from)
      : promotion.valid_from;
    const next_valid_to = dto.valid_to
      ? new Date(dto.valid_to)
      : promotion.valid_to;
    this.assert_valid_date_range(next_valid_from, next_valid_to);

    const normalized_items = dto.items
      ? await this.normalize_promotion_items(business_id, next_type, dto.items)
      : null;

    if (dto.code) {
      this.entity_code_service.validate_code('PN', dto.code.trim());
      promotion.code = dto.code.trim();
    }
    if (dto.name) {
      promotion.name = dto.name.trim();
    }
    if (dto.type) {
      promotion.type = dto.type;
    }
    if (dto.valid_from) {
      promotion.valid_from = next_valid_from;
    }
    if (dto.valid_to) {
      promotion.valid_to = next_valid_to;
    }
    if (dto.is_active !== undefined) {
      promotion.is_active = dto.is_active;
    }

    const saved = await this.promotions_repository.save(promotion);
    if (normalized_items) {
      await this.promotions_repository.replace_items(
        saved.id,
        normalized_items.map((item) => ({
          promotion_id: saved.id,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          min_quantity: item.min_quantity ?? null,
          discount_value: item.discount_value ?? null,
          override_price: item.override_price ?? null,
          bonus_quantity: item.bonus_quantity ?? null,
        })),
      );
    }

    const hydrated = await this.promotions_repository.find_by_id_in_business(
      saved.id,
      business_id,
    );
    if (!hydrated) {
      throw new DomainNotFoundException({
        code: 'PROMOTION_NOT_FOUND',
        messageKey: 'inventory.promotion_not_found',
        details: {
          promotion_id: saved.id,
        },
      });
    }

    return this.serialize_promotion(hydrated);
  }

  async delete_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const promotion = await this.get_promotion_entity(
      business_id,
      promotion_id,
    );
    await this.promotions_repository.remove(promotion);
    return { id: promotion_id };
  }

  private async get_promotion_entity(
    business_id: number,
    promotion_id: number,
  ): Promise<Promotion> {
    const promotion = await this.promotions_repository.find_by_id_in_business(
      promotion_id,
      business_id,
    );
    if (!promotion) {
      throw new DomainNotFoundException({
        code: 'PROMOTION_NOT_FOUND',
        messageKey: 'inventory.promotion_not_found',
        details: {
          promotion_id,
        },
      });
    }

    return promotion;
  }

  private async normalize_promotion_items(
    business_id: number,
    type: PromotionType,
    items: CreatePromotionItemDto[],
  ): Promise<
    Array<
      CreatePromotionItemDto & {
        product_id: number;
        product_variant_id: number | null;
      }
    >
  > {
    const normalized_items: Array<
      CreatePromotionItemDto & {
        product_id: number;
        product_variant_id: number | null;
      }
    > = [];
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

  private assert_valid_date_range(
    valid_from: string | Date,
    valid_to: string | Date,
  ): void {
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

  private serialize_promotion(promotion: Promotion) {
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
