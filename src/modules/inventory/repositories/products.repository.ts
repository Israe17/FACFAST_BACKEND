import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Product } from '../entities/product.entity';

const product_relations = {
  category: true,
  brand: true,
  stock_unit: true,
  sale_unit: true,
  tax_profile: true,
  warranty_profile: true,
} as const;

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
