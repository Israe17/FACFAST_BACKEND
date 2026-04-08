import { EntityManager } from 'typeorm';
import { DispatchStopLine } from '../entities/dispatch-stop-line.entity';

type SaleOrderLineInfo = {
  id: number;
  product_variant_id: number;
  quantity: number;
};

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
