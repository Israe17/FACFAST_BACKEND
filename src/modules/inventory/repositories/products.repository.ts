import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { EntityCodeService } from '../../common/services/entity-code.service';
import {
  apply_pagination,
  apply_search,
  apply_sorting,
} from '../../common/utils/query-builder.util';
import { Product } from '../entities/product.entity';

const product_relations = {
  category: true,
  brand: true,
  stock_unit: true,
  sale_unit: true,
  tax_profile: true,
  warranty_profile: true,
} as const;

const PRODUCT_SORT_COLUMNS: Record<string, string> = {
  name: 'product.name',
  code: 'product.code',
  sku: 'product.sku',
  type: 'product.type',
  created_at: 'product.created_at',
  updated_at: 'product.updated_at',
};

const PRODUCT_SEARCH_COLUMNS = [
  'product.name',
  'product.code',
  'product.sku',
  'product.barcode',
  'product.description',
];

@Injectable()
export class ProductsRepository {
  constructor(
    @InjectRepository(Product)
    private readonly product_repository: Repository<Product>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Product>): Product {
    return this.product_repository.create(payload);
  }

  async save(product: Product): Promise<Product> {
    const saved_product = await this.product_repository.save(product);
    return this.entity_code_service.ensure_code(
      this.product_repository,
      saved_product,
      'PD',
    );
  }

  async find_all_by_business(business_id: number): Promise<Product[]> {
    return this.product_repository.find({
      where: { business_id },
      relations: product_relations,
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Product | null> {
    return this.product_repository.findOne({
      where: { id, business_id },
      relations: product_relations,
    });
  }

  async find_many_by_ids_in_business(
    business_id: number,
    ids: number[],
  ): Promise<Product[]> {
    if (!ids.length) {
      return [];
    }

    return this.product_repository.find({
      where: {
        business_id,
        id: In(ids),
      },
      relations: product_relations,
    });
  }

  async find_paginated_by_business(
    business_id: number,
    query: PaginatedQueryDto,
    mapper: (product: Product) => unknown,
  ): Promise<PaginatedResponseDto<unknown>> {
    const qb = this.product_repository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.brand', 'brand')
      .leftJoinAndSelect('product.stock_unit', 'stock_unit')
      .leftJoinAndSelect('product.sale_unit', 'sale_unit')
      .leftJoinAndSelect('product.tax_profile', 'tax_profile')
      .leftJoinAndSelect('product.warranty_profile', 'warranty_profile')
      .where('product.business_id = :business_id', { business_id });

    apply_search(qb, query.search, PRODUCT_SEARCH_COLUMNS);
    apply_sorting(
      qb,
      query.sort_by,
      query.sort_order,
      PRODUCT_SORT_COLUMNS,
      'product.name',
      'ASC',
    );

    return apply_pagination(qb, query, mapper);
  }

  async exists_sku_in_business(
    business_id: number,
    sku: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.product_repository
      .createQueryBuilder('product')
      .where('product.business_id = :business_id', { business_id })
      .andWhere('LOWER(product.sku) = LOWER(:sku)', { sku });

    if (exclude_id !== undefined) {
      query.andWhere('product.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }

  async exists_barcode_in_business(
    business_id: number,
    barcode: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.product_repository
      .createQueryBuilder('product')
      .where('product.business_id = :business_id', { business_id })
      .andWhere('product.barcode = :barcode', { barcode });

    if (exclude_id !== undefined) {
      query.andWhere('product.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
