import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListView } from '../contracts/price-list.view';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { PriceListSerializer } from '../serializers/price-list.serializer';

export type CreatePriceListCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreatePriceListDto;
};

@Injectable()
export class CreatePriceListUseCase
  implements CommandUseCase<CreatePriceListCommand, PriceListView>
{
  constructor(
    private readonly price_lists_repository: PriceListsRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly price_list_serializer: PriceListSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreatePriceListCommand): Promise<PriceListView> {
    const business_id = resolve_effective_business_id(current_user);
    if (
      await this.price_lists_repository.exists_name_in_business(
        business_id,
        dto.name.trim(),
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

    if (dto.code) {
      this.entity_code_service.validate_code('PL', dto.code);
    }

    if (dto.is_default) {
      await this.price_lists_repository.unset_default_for_business(business_id);
    }

    const price_list = await this.price_lists_repository.save(
      this.price_lists_repository.create({
        business_id,
        code: dto.code?.trim() ?? null,
        name: dto.name.trim(),
        kind: dto.kind,
        currency: dto.currency.trim().toUpperCase(),
        is_default: dto.is_default ?? false,
        is_active: dto.is_active ?? true,
      }),
    );

    return this.price_list_serializer.serialize(price_list);
  }
}
