import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { FulfillmentMode } from '../../sales/enums/fulfillment-mode.enum';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../../sales/enums/sale-order-status.enum';
import { DispatchSaleOrderPolicy } from './dispatch-sale-order.policy';

describe('DispatchSaleOrderPolicy', () => {
  let policy: DispatchSaleOrderPolicy;

  beforeEach(() => {
    policy = new DispatchSaleOrderPolicy();
  });

  it('rejects sale orders that are not delivery orders', () => {
    expect(() =>
      policy.assert_dispatchable_sale_order(10, {
        id: 1,
        branch_id: 10,
        dispatch_status: SaleDispatchStatus.PENDING,
        fulfillment_mode: FulfillmentMode.PICKUP,
        status: SaleOrderStatus.CONFIRMED,
        warehouse_id: 4,
      }),
    ).toThrow(DomainBadRequestException);
  });

  it('rejects sale orders that are already assigned or dispatched', () => {
    expect(() =>
      policy.assert_dispatchable_sale_order(10, {
        id: 1,
        branch_id: 10,
        dispatch_status: SaleDispatchStatus.DISPATCHED,
        fulfillment_mode: FulfillmentMode.DELIVERY,
        status: SaleOrderStatus.CONFIRMED,
        warehouse_id: 4,
      }),
    ).toThrow(DomainBadRequestException);
  });

  it('allows confirmed delivery sale orders pending dispatch', () => {
    expect(() =>
      policy.assert_dispatchable_sale_order(10, {
        id: 1,
        branch_id: 10,
        dispatch_status: SaleDispatchStatus.PENDING,
        fulfillment_mode: FulfillmentMode.DELIVERY,
        status: SaleOrderStatus.CONFIRMED,
        warehouse_id: 4,
      }),
    ).not.toThrow();
  });

  it('allows assigned sale orders already attached to a dispatch', () => {
    expect(() =>
      policy.assert_dispatch_order_sale_order(10, {
        id: 1,
        branch_id: 10,
        dispatch_status: SaleDispatchStatus.ASSIGNED,
        fulfillment_mode: FulfillmentMode.DELIVERY,
        status: SaleOrderStatus.CONFIRMED,
        warehouse_id: 4,
      }),
    ).not.toThrow();
  });

  it('rejects warehouse mismatches against dispatch origin warehouse', () => {
    expect(() =>
      policy.assert_dispatchable_sale_order(
        10,
        {
          id: 1,
          branch_id: 10,
          dispatch_status: SaleDispatchStatus.PENDING,
          fulfillment_mode: FulfillmentMode.DELIVERY,
          status: SaleOrderStatus.CONFIRMED,
          warehouse_id: 4,
        },
        9,
      ),
    ).toThrow(DomainBadRequestException);
  });
});
