import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListView } from '../contracts/price-list.view';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { PriceListSerializer } from '../serializers/price-list.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type UpdatePriceListCommand = {
  current_user: AuthenticatedUserContext;
  price_list_id: number;
  dto: UpdatePriceListDto;
};

@Injectable()
export class UpdatePriceListUseCase
  implements CommandUseCase<UpdatePriceListCommand, PriceListView>
{
  constructor(
    private readonly price_lists_repository: PriceListsRepository,
    private readonly pricing_validation_service: PricingValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly price_list_serializer: PriceListSerializer,
  ) {}

  async execute({
    current_user,
    price_list_id,
    dto,
  }: UpdatePriceListCommand): Promise<PriceListView> {
    const business_id = resolve_effective_business_id(current_user);
    const price_list =
      await this.pricing_validation_service.get_price_list_in_business(
        business_id,
        price_list_id,
      );

    const next_name = dto.name?.trim() ?? price_list.name;
    if (
      await this.price_lists_repository.exists_name_in_business(
        business_id,
        next_name,
        price_list.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'PRICE_LIST_NAME_DUPLICATE',
        messageKey: 'inventory.price_list_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('PL', dto.code.trim());
      }
      price_list.code = dto.code?.trim() ?? null;
    }
    if (dto.name) {
      price_list.name = dto.name.trim();
    }
    if (dto.kind) {
      price_list.kind = dto.kind;
    }
    if (dto.currency) {
      price_list.currency = dto.currency.trim().toUpperCase();
    }
    if (dto.is_default !== undefined) {
      if (dto.is_default) {
        await this.price_lists_repository.unset_default_for_business(
          business_id,
          price_list.id,
        );
      }
      price_list.is_default = dto.is_default;
    }
    if (dto.is_active !== undefined) {
      price_list.is_active = dto.is_active;
    }

    const saved_price_list = await this.price_lists_repository.save(price_list);
    return this.price_list_serializer.serialize(saved_price_list);
  }
}
