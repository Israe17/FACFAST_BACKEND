import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
}
