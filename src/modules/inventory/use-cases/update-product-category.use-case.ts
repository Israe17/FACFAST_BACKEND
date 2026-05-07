import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductCategoryView } from '../contracts/product-category.view';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { ProductCategory } from '../entities/product-category.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductCategorySerializer } from '../serializers/product-category.serializer';
import { EnsureTaxProfileForCabysUseCase } from './ensure-tax-profile-for-cabys.use-case';

export type UpdateProductCategoryCommand = {
  current_user: AuthenticatedUserContext;
  category_id: number;
  dto: UpdateProductCategoryDto;
};

@Injectable()
export class UpdateProductCategoryUseCase
  implements CommandUseCase<UpdateProductCategoryCommand, ProductCategoryView>
{
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly ensure_tax_profile_for_cabys_use_case: EnsureTaxProfileForCabysUseCase,
    private readonly product_category_serializer: ProductCategorySerializer,
  ) {}

  async execute({
    current_user,
    category_id,
    dto,
  }: UpdateProductCategoryCommand): Promise<ProductCategoryView> {
    const business_id = resolve_effective_business_id(current_user);
    const category = await this.find_or_throw(business_id, category_id);

    let parent = category.parent_id
      ? await this.product_categories_repository.find_by_id_in_business(
          category.parent_id,
          business_id,
        )
      : null;

    if (dto.parent_id !== undefined) {
      if (dto.parent_id === category.id) {
        throw new DomainBadRequestException({
          code: 'CATEGORY_PARENT_SELF_INVALID',
          messageKey: 'inventory.category_parent_self_invalid',
          details: { category_id },
        });
      }

      parent = dto.parent_id
        ? await this.find_or_throw(business_id, dto.parent_id)
        : null;

      if (parent?.path?.includes(`/${category.id}/`)) {
        throw new DomainBadRequestException({
          code: 'CATEGORY_PARENT_DESCENDANT_INVALID',
          messageKey: 'inventory.category_parent_descendant_invalid',
          details: { category_id, parent_id: parent.id },
        });
      }
    }

    const next_name = dto.name?.trim() ?? category.name;
    const next_parent_id =
      dto.parent_id !== undefined ? (parent?.id ?? null) : category.parent_id;

    if (
      await this.product_categories_repository.exists_name_in_scope(
        business_id,
        next_name,
        next_parent_id,
        category.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'CATEGORY_NAME_DUPLICATE',
        messageKey: 'inventory.category_name_duplicate',
        details: { field: 'name', parent_id: next_parent_id },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('CG', dto.code.trim());
      }
      category.code = dto.code?.trim() ?? null;
    }
    if (dto.name) {
      category.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      category.description = this.normalize_optional_string(dto.description);
    }
    if (dto.parent_id !== undefined) {
      category.parent_id = parent?.id ?? null;
    }
    if (dto.cabys_code !== undefined) {
      const next_cabys_code = this.normalize_optional_string(dto.cabys_code);
      if (next_cabys_code) {
        const tax_profile =
          await this.ensure_tax_profile_for_cabys_use_case.execute({
            business_id,
            cabys_code: next_cabys_code,
            cabys_descripcion: this.normalize_optional_string(
              dto.cabys_descripcion,
            ),
            cabys_impuesto: dto.cabys_impuesto ?? null,
            item_kind: dto.item_kind ?? TaxProfileItemKind.GOODS,
          });
        category.default_tax_profile_id = tax_profile?.id ?? null;
      } else {
        category.default_tax_profile_id = null;
      }
    }
    if (dto.is_active !== undefined) {
      category.is_active = dto.is_active;
    }

    category.level = parent ? (parent.level ?? 0) + 1 : 0;
    category.path = parent
      ? `${parent.path}${category.id}/`
      : `/${category.id}/`;

    const saved_category =
      await this.product_categories_repository.save(category);
    await this.refresh_descendants(saved_category);

    const persisted =
      await this.product_categories_repository.find_by_id_in_business(
        saved_category.id,
        business_id,
      );
    return this.product_category_serializer.serialize(persisted!);
  }

  private async refresh_descendants(parent: ProductCategory): Promise<void> {
    const children = await this.product_categories_repository.find_children(
      parent.id,
      parent.business_id,
    );

    for (const child of children) {
      child.level = (parent.level ?? 0) + 1;
      child.path = `${parent.path}${child.id}/`;
      const saved_child = await this.product_categories_repository.save(child);
      await this.refresh_descendants(saved_child);
    }
  }

  private async find_or_throw(
    business_id: number,
    category_id: number,
  ): Promise<ProductCategory> {
    const category =
      await this.product_categories_repository.find_by_id_in_business(
        category_id,
        business_id,
      );
    if (!category) {
      throw new DomainNotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        messageKey: 'inventory.category_not_found',
        details: { category_id },
      });
    }
    return category;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
