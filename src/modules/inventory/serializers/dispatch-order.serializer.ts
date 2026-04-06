import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';

@Injectable()
export class DispatchOrderSerializer
  implements EntitySerializer<DispatchOrder, DispatchOrderView>
{
  serialize(order: DispatchOrder): DispatchOrderView {
    const can_ready = order.status === DispatchOrderStatus.DRAFT;
    const can_edit =
      order.status === DispatchOrderStatus.DRAFT ||
      order.status === DispatchOrderStatus.READY;
    const can_dispatch = order.status === DispatchOrderStatus.READY;
    const all_stops_resolved =
      (order.stops?.length ?? 0) > 0 &&
      (order.stops ?? []).every(
        (stop) =>
          stop.status !== DispatchStopStatus.PENDING &&
          stop.status !== DispatchStopStatus.IN_TRANSIT,
      );
    const can_complete =
      (order.status === DispatchOrderStatus.DISPATCHED ||
        order.status === DispatchOrderStatus.IN_TRANSIT) &&
      all_stops_resolved;
    const can_cancel =
      order.status === DispatchOrderStatus.DRAFT ||
      order.status === DispatchOrderStatus.READY;
    const can_delete =
      order.status === DispatchOrderStatus.DRAFT ||
      order.status === DispatchOrderStatus.CANCELLED;

    return {
      id: order.id,
      code: order.code,
      business_id: order.business_id,
      branch_id: order.branch_id,
      branch: order.branch
        ? { id: order.branch.id, name: order.branch.name }
        : null,
      dispatch_type: order.dispatch_type,
      status: order.status,
      route_id: order.route_id,
      route: order.route
        ? {
            id: order.route.id,
            code: order.route.code,
            name: order.route.name,
          }
        : null,
      vehicle_id: order.vehicle_id,
      vehicle: order.vehicle
        ? {
            id: order.vehicle.id,
            code: order.vehicle.code,
            name: order.vehicle.name,
            plate_number: order.vehicle.plate_number,
          }
        : null,
      driver_user_id: order.driver_user_id,
      driver_user: order.driver_user
        ? { id: order.driver_user.id, name: order.driver_user.name }
        : null,
      origin_warehouse_id: order.origin_warehouse_id,
      origin_warehouse: order.origin_warehouse
        ? {
            id: order.origin_warehouse.id,
            name: order.origin_warehouse.name,
          }
        : null,
      scheduled_date: order.scheduled_date,
      dispatched_at: order.dispatched_at,
      completed_at: order.completed_at,
      notes: order.notes,
      created_by_user_id: order.created_by_user_id,
      created_by_user: order.created_by_user
        ? { id: order.created_by_user.id, name: order.created_by_user.name }
        : null,
      stops: (order.stops ?? []).map((stop) => ({
        id: stop.id,
        sale_order_id: stop.sale_order_id,
        sale_order: stop.sale_order
          ? {
              id: stop.sale_order.id,
              code: stop.sale_order.code,
              status: stop.sale_order.status,
              dispatch_status: stop.sale_order.dispatch_status,
            }
          : null,
        customer_contact_id: stop.customer_contact_id,
        customer_contact: stop.customer_contact
          ? {
              id: stop.customer_contact.id,
              name: stop.customer_contact.name,
            }
          : null,
        delivery_sequence: stop.delivery_sequence,
        delivery_address: stop.delivery_address,
        delivery_province: stop.delivery_province,
        delivery_canton: stop.delivery_canton,
        delivery_district: stop.delivery_district,
        status: stop.status,
        delivered_at: stop.delivered_at,
        received_by: stop.received_by,
        failure_reason: stop.failure_reason,
        notes: stop.notes,
        created_at: stop.created_at,
        updated_at: stop.updated_at,
      })),
      expenses: (order.expenses ?? []).map((expense) => ({
        id: expense.id,
        expense_type: expense.expense_type,
        description: expense.description,
        amount: expense.amount,
        receipt_number: expense.receipt_number,
        notes: expense.notes,
        created_by_user_id: expense.created_by_user_id,
        created_by_user: expense.created_by_user
          ? {
              id: expense.created_by_user.id,
              name: expense.created_by_user.name,
            }
          : null,
        created_at: expense.created_at,
        updated_at: expense.updated_at,
      })),
      lifecycle: {
        can_ready,
        can_edit,
        can_dispatch,
        can_complete,
        can_cancel,
        can_delete,
        readiness: {
          missing_scheduled_date: !order.scheduled_date,
          missing_vehicle: !order.vehicle_id,
          missing_driver: !order.driver_user_id,
          missing_stops: (order.stops?.length ?? 0) === 0,
        },
      },
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
