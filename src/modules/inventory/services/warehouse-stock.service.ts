import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryBalance } from '../entities/inventory-balance.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { InventoryBalancesRepository } from '../repositories/inventory-balances.repository';
import { WarehouseStockRepository } from '../repositories/warehouse-stock.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class WarehouseStockService {
  constructor(
    private readonly inventory_balances_repository: InventoryBalancesRepository,
    private readonly warehouse_stock_repository: WarehouseStockRepository,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async get_stock(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const accessible_branch_ids =
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      );
    const balances = await this.inventory_balances_repository.find_all_by_business(
      business_id,
      accessible_branch_ids,
    );
    const legacy_stock = await this.warehouse_stock_repository.find_all_by_business(
      business_id,
      accessible_branch_ids,
    );
    return this.serialize_balances_with_legacy_settings(balances, legacy_stock);
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
    const business_id = resolve_effective_business_id(current_user);
    const balances = await this.inventory_balances_repository.find_all_by_warehouse(
      business_id,
      warehouse.id,
    );
    const legacy_stock = await this.warehouse_stock_repository.find_all_by_warehouse(
      warehouse.id,
      business_id,
    );
    return this.serialize_balances_with_legacy_settings(balances, legacy_stock);
  }

  private serialize_balances_with_legacy_settings(
    balances: InventoryBalance[],
    legacy_stock_rows: WarehouseStock[],
  ) {
    const legacy_stock_map = new Map(
      legacy_stock_rows.map((row) => [
        `${row.warehouse_id}:${row.product_id}`,
        row,
      ]),
    );

    return balances.map((balance) =>
      this.serialize_stock(
        balance,
        legacy_stock_map.get(
          `${balance.warehouse_id}:${balance.product_variant?.product_id ?? 0}`,
        ) ?? null,
      ),
    );
  }

  private serialize_stock(
    balance: InventoryBalance,
    legacy_stock: WarehouseStock | null,
  ) {
    const product = balance.product_variant?.product;

    return {
      id: balance.id,
      business_id: balance.business_id,
      branch_id: balance.warehouse?.branch_id ?? null,
      warehouse: balance.warehouse
        ? {
            id: balance.warehouse.id,
            code: balance.warehouse.code,
            name: balance.warehouse.name,
          }
        : {
            id: balance.warehouse_id,
          },
      product_variant: balance.product_variant
        ? {
            id: balance.product_variant.id,
            sku: balance.product_variant.sku,
            barcode: balance.product_variant.barcode,
            variant_name: balance.product_variant.variant_name,
            is_default: balance.product_variant.is_default,
          }
        : null,
      product: product
        ? {
            id: product.id,
            code: product.code,
            name: product.name,
            type: product.type,
          }
        : {
            id: balance.product_variant?.product_id ?? null,
          },
      quantity: balance.on_hand_quantity,
      reserved_quantity: balance.reserved_quantity,
      incoming_quantity: balance.incoming_quantity,
      outgoing_quantity: balance.outgoing_quantity,
      available_quantity:
        Number(balance.on_hand_quantity) - Number(balance.reserved_quantity),
      projected_quantity:
        Number(balance.on_hand_quantity) +
        Number(balance.incoming_quantity) -
        Number(balance.outgoing_quantity),
      min_stock: legacy_stock?.min_stock ?? null,
      max_stock: legacy_stock?.max_stock ?? null,
      updated_at: balance.updated_at,
    };
  }
}
