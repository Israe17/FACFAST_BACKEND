import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreatePromotionItemDto } from '../dto/create-promotion-item.dto';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { Promotion } from '../entities/promotion.entity';
import { Product } from '../entities/product.entity';
import { PromotionType } from '../enums/promotion-type.enum';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly promotions_repository: PromotionsRepository,
    private readonly products_repository: ProductsRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_promotions(current_user: AuthenticatedUserContext) {
    const promotions = await this.promotions_repository.find_all_by_business(
      current_user.business_id,
    );
    return promotions.map((promotion) => this.serialize_promotion(promotion));
  }

  async create_promotion(
    current_user: AuthenticatedUserContext,
    dto: CreatePromotionDto,
  ) {
    if (
      await this.promotions_repository.exists_name_in_business(
        current_user.business_id,
        dto.name.trim(),
      )
    ) {
      throw new ConflictException('A promotion with this name already exists.');
    }

    if (dto.code) {
      this.entity_code_service.validate_code('PN', dto.code);
    }
    this.assert_valid_date_range(dto.valid_from, dto.valid_to);

    await this.validate_promotion_items(
      current_user.business_id,
      dto.type,
      dto.items ?? [],
    );

    const promotion = await this.promotions_repository.save(
      this.promotions_repository.create({
        business_id: current_user.business_id,
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
        dto.items.map((item) => ({
          promotion_id: promotion.id,
          product_id: item.product_id,
          min_quantity: item.min_quantity ?? null,
          discount_value: item.discount_value ?? null,
          override_price: item.override_price ?? null,
          bonus_quantity: item.bonus_quantity ?? null,
        })),
      );
    }

    const hydrated = await this.promotions_repository.find_by_id_in_business(
      promotion.id,
      current_user.business_id,
    );
    if (!hydrated) {
      throw new NotFoundException('Promotion not found.');
    }

    return this.serialize_promotion(hydrated);
  }

  async get_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ) {
    return this.serialize_promotion(
      await this.get_promotion_entity(current_user.business_id, promotion_id),
    );
  }

  async update_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    dto: UpdatePromotionDto,
  ) {
    const promotion = await this.get_promotion_entity(
      current_user.business_id,
      promotion_id,
    );

    const next_name = dto.name?.trim() ?? promotion.name;
    if (
      await this.promotions_repository.exists_name_in_business(
        current_user.business_id,
        next_name,
        promotion.id,
      )
    ) {
      throw new ConflictException('A promotion with this name already exists.');
    }

    const next_type = dto.type ?? promotion.type;
    const next_valid_from = dto.valid_from
      ? new Date(dto.valid_from)
      : promotion.valid_from;
    const next_valid_to = dto.valid_to
      ? new Date(dto.valid_to)
      : promotion.valid_to;
    this.assert_valid_date_range(next_valid_from, next_valid_to);

    if (dto.items) {
      await this.validate_promotion_items(
        current_user.business_id,
        next_type,
        dto.items,
      );
    }

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
    if (dto.items) {
      await this.promotions_repository.replace_items(
        saved.id,
        dto.items.map((item) => ({
          promotion_id: saved.id,
          product_id: item.product_id,
          min_quantity: item.min_quantity ?? null,
          discount_value: item.discount_value ?? null,
          override_price: item.override_price ?? null,
          bonus_quantity: item.bonus_quantity ?? null,
        })),
      );
    }

    const hydrated = await this.promotions_repository.find_by_id_in_business(
      saved.id,
      current_user.business_id,
    );
    if (!hydrated) {
      throw new NotFoundException('Promotion not found.');
    }

    return this.serialize_promotion(hydrated);
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
      throw new NotFoundException('Promotion not found.');
    }

    return promotion;
  }

  private async validate_promotion_items(
    business_id: number,
    type: PromotionType,
    items: CreatePromotionItemDto[],
  ): Promise<Product[]> {
    const unique_product_ids = [
      ...new Set(items.map((item) => item.product_id)),
    ];
    if (unique_product_ids.length !== items.length) {
      throw new BadRequestException(
        'Promotion items cannot repeat the same product.',
      );
    }

    const products =
      await this.products_repository.find_many_by_ids_in_business(
        business_id,
        unique_product_ids,
      );
    if (products.length !== unique_product_ids.length) {
      throw new BadRequestException(
        'One or more promotion items reference products outside the business.',
      );
    }

    for (const item of items) {
      this.assert_item_shape(type, item);
    }

    return products;
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
        throw new BadRequestException(
          'Discount promotions require discount_value on each item.',
        );
      }
      return;
    }

    if (type === PromotionType.PRICE_OVERRIDE) {
      if (item.override_price === undefined || item.override_price === null) {
        throw new BadRequestException(
          'Price override promotions require override_price on each item.',
        );
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
        throw new BadRequestException(
          'Buy X get Y promotions require min_quantity and bonus_quantity on each item.',
        );
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
      throw new BadRequestException(
        'valid_to cannot be earlier than valid_from.',
      );
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
