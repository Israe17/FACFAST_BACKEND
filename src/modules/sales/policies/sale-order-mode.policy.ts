import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum';
import { SaleMode } from '../enums/sale-mode.enum';

export type SaleOrderModeInput = {
  sale_mode?: string;
  fulfillment_mode?: string;
  seller_user_id?: number | null;
  delivery_charges?: unknown[] | null;
};

@Injectable()
export class SaleOrderModePolicy {
  assert_mode_coherence({
    sale_mode,
    fulfillment_mode,
    seller_user_id,
    delivery_charges,
  }: SaleOrderModeInput): void {
    if (
      (sale_mode === SaleMode.SELLER_ATTRIBUTED ||
        sale_mode === SaleMode.SELLER_ROUTE) &&
      !seller_user_id
    ) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_SELLER_REQUIRED',
        messageKey: 'sales.order_seller_required',
        details: { sale_mode },
      });
    }

    if (
      sale_mode === SaleMode.SELLER_ROUTE &&
      fulfillment_mode !== FulfillmentMode.DELIVERY
    ) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_ROUTE_REQUIRES_DELIVERY',
        messageKey: 'sales.order_route_requires_delivery',
        details: { sale_mode, fulfillment_mode },
      });
    }

    if (
      fulfillment_mode === FulfillmentMode.PICKUP &&
      delivery_charges &&
      delivery_charges.length > 0
    ) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_PICKUP_NO_DELIVERY_CHARGES',
        messageKey: 'sales.order_pickup_no_delivery_charges',
        details: { fulfillment_mode },
      });
    }
  }
}
