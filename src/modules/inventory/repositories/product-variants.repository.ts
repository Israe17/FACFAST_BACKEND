import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { ProductVariant } from '../entities/product-variant.entity';

@Injectable()
export class ProductVariantsRepository {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly product_variant_repository: Repository<ProductVariant>,
  ) {}

  create(payload: Partial<ProductVariant>): ProductVariant {
    return this.product_variant_repository.create(payload);
  }

  async save(product_variant: ProductVariant): Promise<ProductVariant> {
    return this.product_variant_repository.save(product_variant);
  }

  async find_default_by_product_in_business(
    business_id: number,
    product_id: number,
  ): Promise<ProductVariant | null> {
    return this.product_variant_repository.findOne({
      where: {
        business_id,
        product_id,
        is_default: true,
      },
      relations: {
        product: true,
        stock_unit_measure: true,
        sale_unit_measure: true,
        fiscal_profile: true,
        default_warranty_profile: true,
      },
    });
  }

  async find_all_by_product_in_business(
    business_id: number,
    product_id: number,
  ): Promise<ProductVariant[]> {
    return this.product_variant_repository.find({
      where: {
        business_id,
        product_id,
      },
      relations: {
        stock_unit_measure: true,
        sale_unit_measure: true,
        fiscal_profile: true,
        default_warranty_profile: true,
      },
      order: {
        is_default: 'DESC',
        created_at: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    variant_id: number,
    business_id: number,
  ): Promise<ProductVariant | null> {
    return this.product_variant_repository.findOne({
      where: {
        id: variant_id,
        business_id,
      },
      relations: {
        product: true,
        stock_unit_measure: true,
        sale_unit_measure: true,
        fiscal_profile: true,
        default_warranty_profile: true,
      },
    });
  }

  async exists_sku_in_business(
    business_id: number,
    sku: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const where: Record<string, unknown> = { business_id, sku };
    if (exclude_id) {
      where.id = Not(exclude_id);
    }
    return this.product_variant_repository.exists({ where });
  }

  async exists_barcode_in_business(
    business_id: number,
    barcode: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const where: Record<string, unknown> = { business_id, barcode };
    if (exclude_id) {
      where.id = Not(exclude_id);
    }
    return this.product_variant_repository.exists({ where });
  }

  async count_active_by_product(
    business_id: number,
    product_id: number,
  ): Promise<number> {
    return this.product_variant_repository.count({
      where: {
        business_id,
        product_id,
        is_active: true,
      },
    });
  }

  async count_non_default_by_product(
    business_id: number,
    product_id: number,
  ): Promise<number> {
    return this.product_variant_repository.count({
      where: {
        business_id,
        product_id,
        is_default: false,
      },
    });
  }
}
