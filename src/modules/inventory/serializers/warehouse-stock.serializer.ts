import { Injectable } from '@nestjs/common';
import { WarehouseStockView } from '../contracts/warehouse-stock.view';
import { InventoryBalance } from '../entities/inventory-balance.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';

@Injectable()
export class WarehouseStockSerializer {
  serialize(
    balance: InventoryBalance,
    legacy_stock: WarehouseStock | null,
  ): WarehouseStockView {
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
            sku: balance.product_variant.sku ?? null,
            barcode: balance.product_variant.barcode ?? null,
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
