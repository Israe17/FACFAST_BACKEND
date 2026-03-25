import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionView } from '../contracts/promotion.view';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { PromotionDefinitionPolicy } from '../policies/promotion-definition.policy';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { PromotionSerializer } from '../serializers/promotion.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type CreatePromotionCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreatePromotionDto;
};

@Injectable()
export class CreatePromotionUseCase
  implements CommandUseCase<CreatePromotionCommand, PromotionView>
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
    dto,
  }: CreatePromotionCommand): Promise<PromotionView> {
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
    this.promotion_definition_policy.assert_valid_date_range(
      dto.valid_from,
      dto.valid_to,
    );

    const normalized_items =
      await this.promotion_definition_policy.normalize_promotion_items(
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

    const hydrated_promotion =
      await this.pricing_validation_service.get_promotion_in_business(
        business_id,
        promotion.id,
      );
    return this.promotion_serializer.serialize(hydrated_promotion);
  }
}
