import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { ProductCategory } from '../entities/product-category.entity';

@Injectable()
export class ProductCategoriesRepository {
  constructor(
    @InjectRepository(ProductCategory)
    private readonly product_category_repository: Repository<ProductCategory>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<ProductCategory>): ProductCategory {
    return this.product_category_repository.create(payload);
  }

  async save(category: ProductCategory): Promise<ProductCategory> {
    const saved_category =
      await this.product_category_repository.save(category);
    return this.entity_code_service.ensure_code(
      this.product_category_repository,
      saved_category,
      'CG',
    );
  }

  async find_all_by_business(business_id: number): Promise<ProductCategory[]> {
    return this.product_category_repository.find({
      where: {
        business_id,
      },
      order: {
        level: 'ASC',
        name: 'ASC',
      },
    });
  }

  async find_roots_by_business(
    business_id: number,
  ): Promise<ProductCategory[]> {
    return this.product_category_repository.find({
      where: {
        business_id,
        parent_id: IsNull(),
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<ProductCategory | null> {
    return this.product_category_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: {
        parent: true,
      },
    });
  }

  async find_children(parent_id: number): Promise<ProductCategory[]> {
    return this.product_category_repository.find({
      where: {
        parent_id,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async exists_name_in_scope(
    business_id: number,
    name: string,
    parent_id?: number | null,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.product_category_repository
      .createQueryBuilder('category')
      .where('category.business_id = :business_id', { business_id })
      .andWhere('LOWER(category.name) = LOWER(:name)', { name });

    if (parent_id === null || parent_id === undefined) {
      query.andWhere('category.parent_id IS NULL');
    } else {
      query.andWhere('category.parent_id = :parent_id', { parent_id });
    }

    if (exclude_id !== undefined) {
      query.andWhere('category.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
