import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { WarehouseStockRepository } from '../repositories/warehouse-stock.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class WarehouseStockService {
  constructor(
    private readonly warehouse_stock_repository: WarehouseStockRepository,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async get_stock(current_user: AuthenticatedUserContext) {
    const stock = await this.warehouse_stock_repository.find_all_by_business(
      current_user.business_id,
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
    );
    return stock.map((item) => this.serialize_stock(item));
  }

  async get_stock_by_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ) {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    const stock = await this.warehouse_stock_repository.find_all_by_warehouse(
      warehouse.id,
      current_user.business_id,
    );
    return stock.map((item) => this.serialize_stock(item));
  }

  private serialize_stock(stock: WarehouseStock) {
    return {
      id: stock.id,
      business_id: stock.business_id,
      branch_id: stock.branch_id,
      warehouse: stock.warehouse
        ? {
            id: stock.warehouse.id,
            code: stock.warehouse.code,
            name: stock.warehouse.name,
          }
        : {
            id: stock.warehouse_id,
          },
      product: stock.product
        ? {
            id: stock.product.id,
            code: stock.product.code,
            name: stock.product.name,
            type: stock.product.type,
          }
        : {
            id: stock.product_id,
          },
      quantity: stock.quantity,
      reserved_quantity: stock.reserved_quantity,
      available_quantity:
        Number(stock.quantity) - Number(stock.reserved_quantity),
      min_stock: stock.min_stock,
      max_stock: stock.max_stock,
      updated_at: stock.updated_at,
    };
  }
}
