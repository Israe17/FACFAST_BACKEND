import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, In, Repository } from 'typeorm';
import { WarehouseStock } from '../entities/warehouse-stock.entity';

export type LegacyWarehouseStockLookupKey = {
  warehouse_id: number;
  product_id: number;
  product_variant_id: number | null;
};

@Injectable()
export class WarehouseStockRepository {
  constructor(
    @InjectRepository(WarehouseStock)
    private readonly warehouse_stock_repository: Repository<WarehouseStock>,
  ) {}

  create(payload: Partial<WarehouseStock>): WarehouseStock {
    return this.warehouse_stock_repository.create(payload);
  }

  async save(stock: WarehouseStock): Promise<WarehouseStock> {
    return this.warehouse_stock_repository.save(stock);
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<WarehouseStock[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.warehouse_stock_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: {
        warehouse: true,
        product: true,
        product_variant: true,
      },
      order: {
        warehouse_id: 'ASC',
        product_id: 'ASC',
      },
    });
  }

  async find_all_by_warehouse(
    warehouse_id: number,
    business_id: number,
  ): Promise<WarehouseStock[]> {
    return this.warehouse_stock_repository.find({
      where: {
        warehouse_id,
        business_id,
      },
      relations: {
        warehouse: true,
        product: true,
        product_variant: true,
      },
      order: {
        product_id: 'ASC',
      },
    });
  }

  async find_legacy_settings_by_keys(
    business_id: number,
    keys: LegacyWarehouseStockLookupKey[],
  ): Promise<WarehouseStock[]> {
    if (!keys.length) {
      return [];
    }

    const query = this.warehouse_stock_repository
      .createQueryBuilder('warehouse_stock')
      .where('warehouse_stock.business_id = :business_id', { business_id })
      .andWhere(
        new Brackets((qb) => {
          keys.forEach((key, index) => {
            const warehouse_param = `warehouse_id_${index}`;
            const product_param = `product_id_${index}`;
            const variant_param = `product_variant_id_${index}`;

            const base_expression =
              `warehouse_stock.warehouse_id = :${warehouse_param} ` +
              `AND warehouse_stock.product_id = :${product_param}`;

            if (key.product_variant_id === null) {
              qb.orWhere(
                `(${base_expression} AND warehouse_stock.product_variant_id IS NULL)`,
                {
                  [warehouse_param]: key.warehouse_id,
                  [product_param]: key.product_id,
                },
              );
              return;
            }

            qb.orWhere(
              `(${base_expression} AND warehouse_stock.product_variant_id = :${variant_param})`,
              {
                [warehouse_param]: key.warehouse_id,
                [product_param]: key.product_id,
                [variant_param]: key.product_variant_id,
              },
            );
          });
        }),
      );

    return query.getMany();
  }

  async find_by_warehouse_and_product(
    business_id: number,
    warehouse_id: number,
    product_id: number,
    product_variant_id?: number | null,
  ): Promise<WarehouseStock | null> {
    return this.warehouse_stock_repository.findOne({
      where: {
        business_id,
        warehouse_id,
        product_id,
        ...(product_variant_id ? { product_variant_id } : {}),
      },
    });
  }

  async count_by_variant_in_business(
    business_id: number,
    product_variant_id: number,
  ): Promise<number> {
    return this.warehouse_stock_repository.count({
      where: {
        business_id,
        product_variant_id,
      },
    });
  }
}
