import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductCategoryView } from '../contracts/product-category.view';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { ProductCategory } from '../entities/product-category.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductCategorySerializer } from '../serializers/product-category.serializer';
import { EnsureTaxProfileForCabysUseCase } from './ensure-tax-profile-for-cabys.use-case';

export type CreateProductCategoryCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateProductCategoryDto;
};

@Injectable()
export class CreateProductCategoryUseCase
  implements CommandUseCase<CreateProductCategoryCommand, ProductCategoryView>
{
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly ensure_tax_profile_for_cabys_use_case: EnsureTaxProfileForCabysUseCase,
    private readonly product_category_serializer: ProductCategorySerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateProductCategoryCommand): Promise<ProductCategoryView> {
    const business_id = resolve_effective_business_id(current_user);
    const parent = dto.parent_id
      ? await this.find_parent_or_throw(business_id, dto.parent_id)
      : null;

    if (
      await this.product_categories_repository.exists_name_in_scope(
        business_id,
        dto.name.trim(),
        parent?.id ?? null,
      )
    ) {
      throw new DomainConflictException({
        code: 'CATEGORY_NAME_DUPLICATE',
        messageKey: 'inventory.category_name_duplicate',
        details: {
          field: 'name',
          parent_id: parent?.id ?? null,
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('CG', dto.code);
    }

    const cabys_code = this.normalize_optional_string(dto.cabys_code);
    const default_tax_profile_id = cabys_code
      ? (
          await this.ensure_tax_profile_for_cabys_use_case.execute({
            business_id,
            cabys_code,
            cabys_descripcion: this.normalize_optional_string(
              dto.cabys_descripcion,
            ),
            cabys_impuesto: dto.cabys_impuesto ?? null,
            item_kind: dto.item_kind ?? TaxProfileItemKind.GOODS,
          })
        )?.id ?? null
      : null;

    let category = this.product_categories_repository.create({
      business_id,
      code: dto.code?.trim() ?? null,
      name: dto.name.trim(),
      description: this.normalize_optional_string(dto.description),
      parent_id: parent?.id ?? null,
      level: null,
      path: null,
      default_tax_profile_id,
      is_active: dto.is_active ?? true,
    });

    category = await this.product_categories_repository.save(category);
    category.level = parent ? (parent.level ?? 0) + 1 : 0;
    category.path = parent
      ? `${parent.path}${category.id}/`
      : `/${category.id}/`;

    const saved_category =
      await this.product_categories_repository.save(category);

    const persisted =
      await this.product_categories_repository.find_by_id_in_business(
        saved_category.id,
        business_id,
      );
    return this.product_category_serializer.serialize(persisted!);
  }

  private async find_parent_or_throw(
    business_id: number,
    parent_id: number,
  ): Promise<ProductCategory> {
    const parent =
      await this.product_categories_repository.find_by_id_in_business(
        parent_id,
        business_id,
      );
    if (!parent) {
      throw new DomainNotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        messageKey: 'inventory.category_not_found',
        details: { category_id: parent_id },
      });
    }
    return parent;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
