import { Injectable } from '@nestjs/common';
import { DispatchOrder } from '../../inventory/entities/dispatch-order.entity';
import { InventoryReservation } from '../../inventory/entities/inventory-reservation.entity';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrderView } from '../contracts/sale-order.view';
import { can_cancel_sale_order_with_dispatch_status } from '../utils/sale-dispatch-status.util';

@Injectable()
export class SaleOrderSerializer {
  serialize(
    order: SaleOrder,
    reservations: InventoryReservation[] = [],
    dispatch_orders: DispatchOrder[] = [],
  ): SaleOrderView {
    const reservation_by_line_id = new Map(
      reservations.map((r) => [r.sale_order_line_id, r]),
    );
    return {
      id: order.id,
      code: order.code,
      business_id: order.business_id,
      branch_id: order.branch_id,
      branch: order.branch
        ? { id: order.branch.id, name: order.branch.name }
        : undefined,
      customer_contact_id: order.customer_contact_id,
      customer_contact: order.customer_contact
        ? { id: order.customer_contact.id, name: order.customer_contact.name }
        : undefined,
      seller_user_id: order.seller_user_id,
      seller: order.seller
        ? { id: order.seller.id, name: order.seller.name }
        : null,
      sale_mode: order.sale_mode,
      fulfillment_mode: order.fulfillment_mode,
      status: order.status,
      dispatch_status: order.dispatch_status,
      order_date: order.order_date,
      delivery_address: order.delivery_address,
      delivery_province: order.delivery_province,
      delivery_canton: order.delivery_canton,
      delivery_district: order.delivery_district,
      delivery_latitude: order.delivery_latitude ?? null,
      delivery_longitude: order.delivery_longitude ?? null,
      delivery_zone_id: order.delivery_zone_id,
      delivery_zone: order.delivery_zone
        ? { id: order.delivery_zone.id, name: order.delivery_zone.name }
        : null,
      delivery_requested_date: order.delivery_requested_date,
      warehouse_id: order.warehouse_id,
      warehouse: order.warehouse
        ? { id: order.warehouse.id, name: order.warehouse.name }
        : null,
      notes: order.notes,
      internal_notes: order.internal_notes,
      created_by_user_id: order.created_by_user_id,
      created_by_user: order.created_by_user
        ? { id: order.created_by_user.id, name: order.created_by_user.name }
        : undefined,
      lines: (order.lines ?? []).map((line) => ({
        id: line.id,
        line_no: line.line_no,
        product_variant_id: line.product_variant_id,
        product_variant: line.product_variant
          ? {
              id: line.product_variant.id,
              variant_name: line.product_variant.variant_name ?? null,
              sku: line.product_variant.sku,
              product: line.product_variant.product
                ? {
                    id: line.product_variant.product.id,
                    name: line.product_variant.product.name,
                  }
                : undefined,
            }
          : undefined,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        tax_amount: line.tax_amount,
        line_total: line.line_total,
        reservation: (() => {
          const r = reservation_by_line_id.get(line.id);
          if (!r) return null;
          return {
            status: r.status,
            reserved_quantity: r.reserved_quantity,
            consumed_quantity: r.consumed_quantity,
            released_quantity: r.released_quantity,
          };
        })(),
        notes: line.notes,
        created_at: line.created_at,
        updated_at: line.updated_at,
      })),
      dispatch_orders: dispatch_orders.map((d) => ({
        id: d.id,
        code: d.code,
        status: d.status,
        scheduled_date: d.scheduled_date,
      })),
      delivery_charges: (order.delivery_charges ?? []).map((charge) => ({
        id: charge.id,
        charge_type: charge.charge_type,
        amount: charge.amount,
        notes: charge.notes,
        created_at: charge.created_at,
        updated_at: charge.updated_at,
      })),
      lifecycle: {
        can_edit: order.status === SaleOrderStatus.DRAFT,
        can_confirm: order.status === SaleOrderStatus.DRAFT,
        can_cancel:
          order.status !== SaleOrderStatus.CANCELLED &&
          can_cancel_sale_order_with_dispatch_status(
            order.dispatch_status ?? SaleDispatchStatus.PENDING,
          ),
        can_delete:
          order.status === SaleOrderStatus.DRAFT ||
          order.status === SaleOrderStatus.CANCELLED,
        can_reset_dispatch:
          order.status === SaleOrderStatus.CONFIRMED &&
          (order.dispatch_status === SaleDispatchStatus.FAILED ||
            order.dispatch_status === SaleDispatchStatus.PARTIAL),
        reasons: [],
      },
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
