import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { WarehouseStock } from '../entities/warehouse-stock.entity';

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
      },
      order: {
        product_id: 'ASC',
      },
    });
  }

  async find_by_warehouse_and_product(
    warehouse_id: number,
    product_id: number,
  ): Promise<WarehouseStock | null> {
    return this.warehouse_stock_repository.findOne({
      where: {
        warehouse_id,
        product_id,
      },
    });
  }
}
