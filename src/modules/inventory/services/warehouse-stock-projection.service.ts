import { Injectable } from '@nestjs/common';
import { WarehouseStockView } from '../contracts/warehouse-stock.view';
import { InventoryBalance } from '../entities/inventory-balance.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import {
  LegacyWarehouseStockLookupKey,
} from '../repositories/warehouse-stock.repository';
import { WarehouseStockSerializer } from '../serializers/warehouse-stock.serializer';

@Injectable()
export class WarehouseStockProjectionService {
  constructor(
    private readonly warehouse_stock_serializer: WarehouseStockSerializer,
  ) {}

  build_legacy_lookup_keys(
    balances: InventoryBalance[],
  ): LegacyWarehouseStockLookupKey[] {
    const keys: LegacyWarehouseStockLookupKey[] = [];
    const seen = new Set<string>();

    for (const balance of balances) {
      const product_id = balance.product_variant?.product_id;
      if (!product_id) {
        continue;
      }

      const candidates: LegacyWarehouseStockLookupKey[] = [
        {
          warehouse_id: balance.warehouse_id,
          product_id,
          product_variant_id: balance.product_variant_id,
        },
        {
          warehouse_id: balance.warehouse_id,
          product_id,
          product_variant_id: null,
        },
      ];

      for (const candidate of candidates) {
        const key =
          `${candidate.warehouse_id}:${candidate.product_id}:` +
          `${candidate.product_variant_id ?? 0}`;
        if (seen.has(key)) {
          continue;
        }

        seen.add(key);
        keys.push(candidate);
      }
    }

    return keys;
  }

  serialize_balances(
    balances: InventoryBalance[],
    legacy_stock_rows: WarehouseStock[],
  ): WarehouseStockView[] {
    const legacy_stock_map = new Map(
      legacy_stock_rows.map((row) => [
        `${row.warehouse_id}:${row.product_id}:${row.product_variant_id ?? 0}`,
        row,
      ]),
    );

    return balances.map((balance) => {
      const product_id = balance.product_variant?.product_id ?? 0;
      const variant_key =
        `${balance.warehouse_id}:${product_id}:${balance.product_variant_id ?? 0}`;
      const product_key = `${balance.warehouse_id}:${product_id}:0`;

      return this.warehouse_stock_serializer.serialize(
        balance,
        legacy_stock_map.get(variant_key) ??
          legacy_stock_map.get(product_key) ??
          null,
      );
    });
  }
}
