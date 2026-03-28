import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly products_repository: ProductsRepository,
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

    let category = this.product_categories_repository.create({
      business_id,
      code: dto.code?.trim() ?? null,
      name: dto.name.trim(),
      description: this.normalize_optional_string(dto.description),
      parent_id: parent?.id ?? null,
      level: null,
      path: null,
      is_active: dto.is_active ?? true,
    });

    category = await this.product_categories_repository.save(category);
    category.level = parent ? (parent.level ?? 0) + 1 : 0;
    category.path = parent
      ? `${parent.path}${category.id}/`
      : `/${category.id}/`;

    return this.serialize_category(
      await this.product_categories_repository.save(category),
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
    return this.serialize_category(saved_category);
  }

  async delete_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const category = await this.get_category_entity(business_id, category_id);

    const children =
      await this.product_categories_repository.find_children(category_id);
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
