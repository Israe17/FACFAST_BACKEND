import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { FulfillmentMode } from '../../sales/enums/fulfillment-mode.enum';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../../sales/enums/sale-order-status.enum';
import { SaleOrder } from '../../sales/entities/sale-order.entity';

@Injectable()
export class DispatchSaleOrderPolicy {
  assert_dispatchable_sale_order(
    dispatch_branch_id: number,
    sale_order: Pick<
      SaleOrder,
      | 'id'
      | 'branch_id'
      | 'dispatch_status'
      | 'fulfillment_mode'
      | 'status'
      | 'warehouse_id'
    >,
    origin_warehouse_id?: number | null,
  ): void {
    this.assert_sale_order_for_dispatch_context(
      dispatch_branch_id,
      sale_order,
      [SaleDispatchStatus.PENDING],
      origin_warehouse_id,
    );
  }

  assert_dispatch_order_sale_order(
    dispatch_branch_id: number,
    sale_order: Pick<
      SaleOrder,
      | 'id'
      | 'branch_id'
      | 'dispatch_status'
      | 'fulfillment_mode'
      | 'status'
      | 'warehouse_id'
    >,
    origin_warehouse_id?: number | null,
  ): void {
    this.assert_sale_order_for_dispatch_context(
      dispatch_branch_id,
      sale_order,
      [SaleDispatchStatus.PENDING, SaleDispatchStatus.ASSIGNED],
      origin_warehouse_id,
    );
  }

  private assert_sale_order_for_dispatch_context(
    dispatch_branch_id: number,
    sale_order: Pick<
      SaleOrder,
      | 'id'
      | 'branch_id'
      | 'dispatch_status'
      | 'fulfillment_mode'
      | 'status'
      | 'warehouse_id'
    >,
    allowed_dispatch_statuses: SaleDispatchStatus[],
    origin_warehouse_id?: number | null,
  ): void {
    if (sale_order.status !== SaleOrderStatus.CONFIRMED) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_DISPATCH_REQUIRES_CONFIRMATION',
        messageKey: 'sales.order_dispatch_requires_confirmation',
        details: {
          sale_order_id: sale_order.id,
          status: sale_order.status,
        },
      });
    }

    if (sale_order.fulfillment_mode !== FulfillmentMode.DELIVERY) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_DISPATCH_REQUIRES_DELIVERY',
        messageKey: 'sales.order_dispatch_requires_delivery',
        details: {
          sale_order_id: sale_order.id,
          fulfillment_mode: sale_order.fulfillment_mode,
        },
      });
    }

    if (!allowed_dispatch_statuses.includes(sale_order.dispatch_status)) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_ALREADY_ASSIGNED_OR_DISPATCHED',
        messageKey: 'sales.order_already_assigned_or_dispatched',
        details: {
          sale_order_id: sale_order.id,
          dispatch_status: sale_order.dispatch_status,
        },
      });
    }

    if (!sale_order.warehouse_id) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_WAREHOUSE_REQUIRED',
        messageKey: 'sales.order_warehouse_required',
        details: {
          sale_order_id: sale_order.id,
        },
      });
    }

    if (sale_order.branch_id !== dispatch_branch_id) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_DISPATCH_BRANCH_MISMATCH',
        messageKey: 'sales.order_dispatch_branch_mismatch',
        details: {
          sale_order_id: sale_order.id,
          sale_order_branch_id: sale_order.branch_id,
          dispatch_branch_id,
        },
      });
    }

    if (
      origin_warehouse_id !== undefined &&
      origin_warehouse_id !== null &&
      sale_order.warehouse_id !== origin_warehouse_id
    ) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_DISPATCH_WAREHOUSE_MISMATCH',
        messageKey: 'sales.order_dispatch_warehouse_mismatch',
        details: {
          sale_order_id: sale_order.id,
          sale_order_warehouse_id: sale_order.warehouse_id,
          origin_warehouse_id,
        },
      });
    }
  }

  assert_date_coherence(
    scheduled_date: string | null | undefined,
    sale_order: Pick<SaleOrder, 'id' | 'delivery_requested_date'>,
  ): void {
    if (!scheduled_date || !sale_order.delivery_requested_date) {
      return;
    }

    if (scheduled_date > sale_order.delivery_requested_date) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_SCHEDULED_DATE_AFTER_DELIVERY_DATE',
        messageKey: 'inventory.dispatch_scheduled_date_after_delivery_date',
        details: {
          sale_order_id: sale_order.id,
          scheduled_date,
          delivery_requested_date: sale_order.delivery_requested_date,
        },
      });
    }
  }
}
