import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_categories(current_user: AuthenticatedUserContext) {
    const categories =
      await this.product_categories_repository.find_all_by_business(
        current_user.business_id,
      );
    return categories.map((category) => this.serialize_category(category));
  }

  async get_tree(current_user: AuthenticatedUserContext) {
    const categories =
      await this.product_categories_repository.find_all_by_business(
        current_user.business_id,
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
    const parent = dto.parent_id
      ? await this.get_category_entity(current_user.business_id, dto.parent_id)
      : null;

    if (
      await this.product_categories_repository.exists_name_in_scope(
        current_user.business_id,
        dto.name.trim(),
        parent?.id ?? null,
      )
    ) {
      throw new ConflictException(
        'A category with this name already exists in the same hierarchy level.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('CG', dto.code);
    }

    let category = this.product_categories_repository.create({
      business_id: current_user.business_id,
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
      await this.get_category_entity(current_user.business_id, category_id),
    );
  }

  async update_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
    dto: UpdateProductCategoryDto,
  ) {
    const category = await this.get_category_entity(
      current_user.business_id,
      category_id,
    );

    let parent = category.parent_id
      ? await this.product_categories_repository.find_by_id_in_business(
          category.parent_id,
          current_user.business_id,
        )
      : null;

    if (dto.parent_id !== undefined) {
      if (dto.parent_id === category.id) {
        throw new BadRequestException(
          'A category cannot be assigned as its own parent.',
        );
      }

      parent = dto.parent_id
        ? await this.get_category_entity(
            current_user.business_id,
            dto.parent_id,
          )
        : null;

      if (parent?.path?.includes(`/${category.id}/`)) {
        throw new BadRequestException(
          'A category cannot be moved under one of its descendants.',
        );
      }
    }

    const next_name = dto.name?.trim() ?? category.name;
    const next_parent_id =
      dto.parent_id !== undefined ? (parent?.id ?? null) : category.parent_id;

    if (
      await this.product_categories_repository.exists_name_in_scope(
        current_user.business_id,
        next_name,
        next_parent_id,
        category.id,
      )
    ) {
      throw new ConflictException(
        'A category with this name already exists in the same hierarchy level.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('CG', dto.code.trim());
      category.code = dto.code.trim();
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
      throw new NotFoundException('Product category not found.');
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
      created_at: category.created_at,
      updated_at: category.updated_at,
    };
  }
}
