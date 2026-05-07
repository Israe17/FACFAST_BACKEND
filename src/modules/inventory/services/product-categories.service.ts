import { Injectable, Logger } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { ProductCategory } from '../entities/product-category.entity';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductsRepository } from '../repositories/products.repository';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';

const HACIENDA_IVA_RATE_CODES: Record<number, string> = {
  0: '01',
  1: '02',
  2: '03',
  4: '04',
  8: '07',
  13: '08',
};

@Injectable()
export class ProductCategoriesService {
  private readonly logger = new Logger(ProductCategoriesService.name);

  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly products_repository: ProductsRepository,
    private readonly tax_profiles_repository: TaxProfilesRepository,
  ) {}

  async get_categories(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const categories =
      await this.product_categories_repository.find_all_by_business(
        business_id,
      );
    return categories.map((category) => this.serialize_category(category));
  }

  async get_tree(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const categories =
      await this.product_categories_repository.find_all_by_business(
        business_id,
      );
    const nodes = new Map(
      categories.map((category) => [
        category.id,
        {
          ...this.serialize_category(category),
          children: [] as Array<
            ReturnType<ProductCategoriesService['serialize_category']>
          >,
        },
      ]),
    );

    const roots: Array<
      ReturnType<ProductCategoriesService['serialize_category']> & {
        children: unknown[];
      }
    > = [];

    for (const category of categories) {
      const node = nodes.get(category.id)!;
      if (category.parent_id && nodes.has(category.parent_id)) {
        nodes.get(category.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }

  async create_category(
    current_user: AuthenticatedUserContext,
    dto: CreateProductCategoryDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const parent = dto.parent_id
      ? await this.get_category_entity(business_id, dto.parent_id)
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
          await this.ensure_tax_profile_for_cabys(
            business_id,
            cabys_code,
            this.normalize_optional_string(dto.cabys_descripcion),
            dto.cabys_impuesto ?? null,
            dto.item_kind ?? TaxProfileItemKind.GOODS,
          )
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

    return this.serialize_category(
      await this.get_category_entity(business_id, saved_category.id),
    );
  }

  async get_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
  ) {
    return this.serialize_category(
      await this.get_category_entity(
        resolve_effective_business_id(current_user),
        category_id,
      ),
    );
  }

  async update_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
    dto: UpdateProductCategoryDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const category = await this.get_category_entity(business_id, category_id);

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
          details: {
            category_id,
          },
        });
      }

      parent = dto.parent_id
        ? await this.get_category_entity(business_id, dto.parent_id)
        : null;

      if (parent?.path?.includes(`/${category.id}/`)) {
        throw new DomainBadRequestException({
          code: 'CATEGORY_PARENT_DESCENDANT_INVALID',
          messageKey: 'inventory.category_parent_descendant_invalid',
          details: {
            category_id,
            parent_id: parent.id,
          },
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
        details: {
          field: 'name',
          parent_id: next_parent_id,
        },
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
        const tax_profile = await this.ensure_tax_profile_for_cabys(
          business_id,
          next_cabys_code,
          this.normalize_optional_string(dto.cabys_descripcion),
          dto.cabys_impuesto ?? null,
          dto.item_kind ?? TaxProfileItemKind.GOODS,
        );
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

    return this.serialize_category(
      await this.get_category_entity(business_id, saved_category.id),
    );
  }

  async delete_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const category = await this.get_category_entity(business_id, category_id);

    const children =
      await this.product_categories_repository.find_children(category_id, business_id);
    if (children.length > 0) {
      throw new DomainBadRequestException({
        code: 'CATEGORY_HAS_CHILDREN',
        messageKey: 'inventory.category_has_children',
        details: { category_id, children_count: children.length },
      });
    }

    const product_count =
      await this.products_repository.count_by_category_in_business(
        business_id,
        category_id,
      );
    if (product_count > 0) {
      throw new DomainBadRequestException({
        code: 'CATEGORY_IN_USE',
        messageKey: 'inventory.category_in_use',
        details: { category_id, product_count },
      });
    }

    await this.product_categories_repository.remove(category);
    return { id: category_id };
  }

  private async get_category_entity(
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
        details: {
          category_id,
        },
      });
    }

    return category;
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

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async ensure_tax_profile_for_cabys(
    business_id: number,
    cabys_code: string,
    cabys_descripcion: string | null,
    cabys_impuesto: number | null,
    item_kind: TaxProfileItemKind = TaxProfileItemKind.GOODS,
  ): Promise<TaxProfile | null> {
    const existing =
      await this.tax_profiles_repository.find_active_by_cabys_in_business(
        business_id,
        cabys_code,
      );
    if (existing) {
      return existing;
    }

    const rate = cabys_impuesto ?? 13;
    const tax_type = rate === 0 ? TaxType.EXENTO : TaxType.IVA;
    const base_label =
      cabys_descripcion?.trim().substring(0, 80) || `CABYS ${cabys_code}`;
    let name = `IVA ${rate}% - ${base_label}`;
    if (
      await this.tax_profiles_repository.exists_name_in_business(
        business_id,
        name,
      )
    ) {
      name = `${name} [${cabys_code}]`;
    }

    const tax_profile = this.tax_profiles_repository.create({
      business_id,
      code: null,
      name,
      description: cabys_descripcion ?? null,
      cabys_code,
      item_kind,
      tax_type,
      iva_rate_code:
        tax_type === TaxType.IVA ? HACIENDA_IVA_RATE_CODES[rate] ?? '08' : null,
      iva_rate: tax_type === TaxType.IVA ? rate : null,
      requires_cabys: true,
      allows_exoneration: true,
      has_specific_tax: false,
      specific_tax_name: null,
      specific_tax_rate: null,
      is_active: true,
    });

    try {
      return await this.tax_profiles_repository.save(tax_profile);
    } catch (error) {
      this.logger.warn(
        `Auto-creation of tax profile for CABYS ${cabys_code} failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
      return null;
    }
  }

  private serialize_category(category: ProductCategory) {
    return {
      id: category.id,
      code: category.code,
      business_id: category.business_id,
      name: category.name,
      description: category.description,
      parent_id: category.parent_id,
      level: category.level,
      path: category.path,
      default_tax_profile_id: category.default_tax_profile_id,
      default_tax_profile: category.default_tax_profile
        ? {
            id: category.default_tax_profile.id,
            name: category.default_tax_profile.name,
            cabys_code: category.default_tax_profile.cabys_code,
            description: category.default_tax_profile.description,
            iva_rate: category.default_tax_profile.iva_rate,
            item_kind: category.default_tax_profile.item_kind,
          }
        : null,
      is_active: category.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: category.is_active,
        can_reactivate: !category.is_active,
        reasons: [],
      },
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }
}
