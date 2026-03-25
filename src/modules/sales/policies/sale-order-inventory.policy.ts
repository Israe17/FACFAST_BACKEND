import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { InventoryBalance } from '../../inventory/entities/inventory-balance.entity';
import { InventoryLedgerService } from '../../inventory/services/inventory-ledger.service';
import { SaleOrder } from '../entities/sale-order.entity';
import { ProductVariant } from '../../inventory/entities/product-variant.entity';

type InventoryDemand = {
  product_variant_id: number;
  requested_quantity: number;
  product_variant: ProductVariant;
};

@Injectable()
export class SaleOrderInventoryPolicy {
  constructor(
    private readonly inventory_ledger_service: InventoryLedgerService,
  ) {}

  async assert_order_can_reserve(
    manager: EntityManager,
    order: SaleOrder,
  ): Promise<void> {
    if (!order.warehouse_id || !order.warehouse) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_WAREHOUSE_REQUIRED',
        messageKey: 'sales.order_warehouse_required',
        details: { order_id: order.id },
      });
    }

    await this.inventory_ledger_service.assert_warehouse_allowed_for_branch(
      order.business_id,
      order.warehouse,
      order.branch_id,
    );

    const grouped_demands = this.group_trackable_demands(order);
    const balances = grouped_demands.length
      ? await manager
          .getRepository(InventoryBalance)
          .createQueryBuilder('inventory_balance')
          .setLock('pessimistic_write')
          .where('inventory_balance.business_id = :business_id', {
            business_id: order.business_id,
          })
          .andWhere('inventory_balance.warehouse_id = :warehouse_id', {
            warehouse_id: order.warehouse.id,
          })
          .andWhere('inventory_balance.product_variant_id IN (:...variant_ids)', {
            variant_ids: grouped_demands.map(
              (demand) => demand.product_variant_id,
            ),
          })
          .getMany()
      : [];
    const balance_by_variant_id = new Map(
      balances.map((balance) => [balance.product_variant_id, balance]),
    );

    for (const demand of grouped_demands) {
      const product_variant = demand.product_variant;

      this.inventory_ledger_service.assert_tenant_consistency(
        order.business_id,
        order.branch?.business_id ?? order.business_id,
        order.warehouse,
        product_variant,
      );

      const balance = balance_by_variant_id.get(demand.product_variant_id);
      const on_hand_quantity = Number(balance?.on_hand_quantity ?? 0);
      const reserved_quantity = Number(balance?.reserved_quantity ?? 0);
      const available_quantity = on_hand_quantity - reserved_quantity;
      if (
        product_variant.allow_negative_stock === false &&
        available_quantity < demand.requested_quantity
      ) {
        throw new DomainBadRequestException({
          code: 'INSUFFICIENT_STOCK',
          messageKey: 'inventory.insufficient_stock',
          details: {
            order_id: order.id,
            warehouse_id: order.warehouse.id,
            product_variant_id: demand.product_variant_id,
            requested_quantity: demand.requested_quantity,
            available_quantity,
          },
        });
      }
    }
  }

  private group_trackable_demands(order: SaleOrder): InventoryDemand[] {
    const demand_by_variant_id = new Map<number, InventoryDemand>();

    for (const line of order.lines ?? []) {
      if (line.product_variant?.track_inventory === false) {
        continue;
      }

      const current_demand = demand_by_variant_id.get(line.product_variant_id);
      if (current_demand) {
        current_demand.requested_quantity += Number(line.quantity);
        continue;
      }

      if (!line.product_variant) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_LINE_VARIANT_REQUIRED',
          messageKey: 'sales.order_line_variant_required',
          details: {
            order_id: order.id,
            product_variant_id: line.product_variant_id,
          },
        });
      }

      const product_variant = line.product_variant;

      demand_by_variant_id.set(line.product_variant_id, {
        product_variant_id: line.product_variant_id,
        requested_quantity: Number(line.quantity),
        product_variant,
      });
    }

    return [...demand_by_variant_id.values()].sort(
      (left, right) => left.product_variant_id - right.product_variant_id,
    );
  }
}
