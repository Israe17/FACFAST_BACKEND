import { EntityManager } from 'typeorm';
import { DispatchStopLine } from '../entities/dispatch-stop-line.entity';
import { SaleOrderLine } from '../../sales/entities/sale-order-line.entity';

type SaleOrderLineInfo = {
  id: number;
  product_variant_id: number;
  quantity: number;
};

/**
 * Returns true if any line of this sale order has been previously
 * delivered (delivered_quantity > 0 in any past dispatch stop).
 * Used to detect re-dispatch scenarios and skip date coherence
 * validation for orders that already had a partial delivery.
 *
 * Accepts either explicit line IDs or a sale_order_id to look them up.
 */
export async function has_previous_deliveries(
  manager: EntityManager,
  business_id: number,
  sale_order_line_ids_or_sale_order_id: number[] | { sale_order_id: number },
): Promise<boolean> {
  let line_ids: number[];

  if (Array.isArray(sale_order_line_ids_or_sale_order_id)) {
    line_ids = sale_order_line_ids_or_sale_order_id;
  } else {
    const lines = await manager.getRepository(SaleOrderLine).find({
      where: {
        sale_order_id: sale_order_line_ids_or_sale_order_id.sale_order_id,
        business_id,
      },
      select: ['id'],
    });
    line_ids = lines.map((l) => l.id);
  }

  if (!line_ids.length) {
    return false;
  }

  const count = await manager
    .getRepository(DispatchStopLine)
    .createQueryBuilder('dsl')
    .where('dsl.business_id = :business_id', { business_id })
    .andWhere('dsl.sale_order_line_id IN (:...ids)', { ids: line_ids })
    .andWhere('dsl.delivered_quantity > 0')
    .getCount();

  return count > 0;
}

/**
 * Creates DispatchStopLine records for a dispatch stop, adjusting
 * `ordered_quantity` to reflect only the REMAINING quantity that
 * hasn't been delivered in previous dispatches.
 *
 * For re-dispatched sale orders (e.g. partial → rehabilitated → re-dispatched),
 * this prevents over-ordering by subtracting previously delivered amounts.
 */
export async function create_dispatch_stop_lines(
  manager: EntityManager,
  params: {
    business_id: number;
    dispatch_stop_id: number;
    sale_order_lines: SaleOrderLineInfo[];
  },
): Promise<void> {
  const { business_id, dispatch_stop_id, sale_order_lines } = params;

  if (!sale_order_lines.length) {
    return;
  }

  const stop_line_repo = manager.getRepository(DispatchStopLine);
  const line_ids = sale_order_lines.map((l) => l.id);

  // Sum delivered quantities from all previous dispatch stop lines
  const previously_delivered: { sale_order_line_id: string; total_delivered: string }[] =
    await stop_line_repo
      .createQueryBuilder('dsl')
      .select('dsl.sale_order_line_id', 'sale_order_line_id')
      .addSelect('COALESCE(SUM(dsl.delivered_quantity), 0)', 'total_delivered')
      .where('dsl.business_id = :business_id', { business_id })
      .andWhere('dsl.sale_order_line_id IN (:...line_ids)', { line_ids })
      .groupBy('dsl.sale_order_line_id')
      .getRawMany();

  const delivered_map = new Map<number, number>();
  for (const row of previously_delivered) {
    delivered_map.set(Number(row.sale_order_line_id), Number(row.total_delivered));
  }

  for (const line of sale_order_lines) {
    const already_delivered = delivered_map.get(line.id) ?? 0;
    const remaining = line.quantity - already_delivered;

    if (remaining <= 0) {
      continue;
    }

    await stop_line_repo.save(
      stop_line_repo.create({
        business_id,
        dispatch_stop_id,
        sale_order_line_id: line.id,
        product_variant_id: line.product_variant_id,
        ordered_quantity: remaining,
      }),
    );
  }
}
