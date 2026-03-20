import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductPrice } from '../entities/product-price.entity';

@Injectable()
export class ProductPricesRepository {
  constructor(
    @InjectRepository(ProductPrice)
    private readonly product_price_repository: Repository<ProductPrice>,
  ) {}

  create(payload: Partial<ProductPrice>): ProductPrice {
    return this.product_price_repository.create(payload);
  }

  async save(product_price: ProductPrice): Promise<ProductPrice> {
    return this.product_price_repository.save(product_price);
  }

  async find_all_by_product_in_business(
    product_id: number,
    business_id: number,
  ): Promise<ProductPrice[]> {
    return this.product_price_repository.find({
      where: {
        product_id,
        business_id,
      },
      relations: {
        price_list: true,
        product_variant: true,
      },
      order: {
        is_active: 'DESC',
        min_quantity: 'ASC',
        created_at: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<ProductPrice | null> {
    return this.product_price_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: {
        product: true,
        product_variant: true,
        price_list: true,
      },
    });
  }

  async remove(product_price: ProductPrice): Promise<void> {
    await this.product_price_repository.remove(product_price);
  }

  async delete_by_price_list_in_business(
    business_id: number,
    price_list_id: number,
  ): Promise<void> {
    await this.product_price_repository.delete({ business_id, price_list_id });
  }

  async count_by_variant_in_business(
    business_id: number,
    product_variant_id: number,
  ): Promise<number> {
    return this.product_price_repository.count({
      where: {
        business_id,
        product_variant_id,
      },
    });
  }
}
