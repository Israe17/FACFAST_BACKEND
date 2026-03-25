import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionView } from '../contracts/promotion.view';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { PromotionDefinitionPolicy } from '../policies/promotion-definition.policy';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { PromotionSerializer } from '../serializers/promotion.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type UpdatePromotionCommand = {
  current_user: AuthenticatedUserContext;
  promotion_id: number;
  dto: UpdatePromotionDto;
};

@Injectable()
export class UpdatePromotionUseCase
  implements CommandUseCase<UpdatePromotionCommand, PromotionView>
{
  constructor(
    private readonly promotions_repository: PromotionsRepository,
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_definition_policy: PromotionDefinitionPolicy,
    private readonly entity_code_service: EntityCodeService,
    private readonly promotion_serializer: PromotionSerializer,
  ) {}

  async execute({
    current_user,
    promotion_id,
    dto,
  }: UpdatePromotionCommand): Promise<PromotionView> {
    const business_id = resolve_effective_business_id(current_user);
    const promotion =
      await this.pricing_validation_service.get_promotion_in_business(
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
    this.promotion_definition_policy.assert_valid_date_range(
      next_valid_from,
      next_valid_to,
    );

    const normalized_items = dto.items
      ? await this.promotion_definition_policy.normalize_promotion_items(
          business_id,
          next_type,
          dto.items,
        )
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

    const saved_promotion = await this.promotions_repository.save(promotion);
    if (normalized_items) {
      await this.promotions_repository.replace_items(
        saved_promotion.id,
        normalized_items.map((item) => ({
          promotion_id: saved_promotion.id,
          product_id: item.product_id,
          product_variant_id: item.product_variant_id,
          min_quantity: item.min_quantity ?? null,
          discount_value: item.discount_value ?? null,
          override_price: item.override_price ?? null,
          bonus_quantity: item.bonus_quantity ?? null,
        })),
      );
    }

    const hydrated_promotion =
      await this.pricing_validation_service.get_promotion_in_business(
        business_id,
        saved_promotion.id,
      );
    return this.promotion_serializer.serialize(hydrated_promotion);
  }
}
