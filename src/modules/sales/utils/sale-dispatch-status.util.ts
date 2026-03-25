import { DispatchStopStatus } from '../../inventory/enums/dispatch-stop-status.enum';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';

export function get_dispatch_status_for_fulfillment_mode(
  fulfillment_mode: FulfillmentMode,
): SaleDispatchStatus {
  return fulfillment_mode === FulfillmentMode.DELIVERY
    ? SaleDispatchStatus.PENDING
    : SaleDispatchStatus.NOT_REQUIRED;
}

export function get_dispatch_status_for_resolved_stop(
  stop_status: DispatchStopStatus,
): SaleDispatchStatus {
  switch (stop_status) {
    case DispatchStopStatus.DELIVERED:
      return SaleDispatchStatus.DELIVERED;
    case DispatchStopStatus.PARTIAL:
      return SaleDispatchStatus.PARTIAL;
    case DispatchStopStatus.FAILED:
    case DispatchStopStatus.SKIPPED:
      return SaleDispatchStatus.FAILED;
    default:
      return SaleDispatchStatus.OUT_FOR_DELIVERY;
  }
}

export function can_cancel_sale_order_with_dispatch_status(
  dispatch_status: SaleDispatchStatus,
): boolean {
  return (
    dispatch_status === SaleDispatchStatus.PENDING ||
    dispatch_status === SaleDispatchStatus.NOT_REQUIRED
  );
}
