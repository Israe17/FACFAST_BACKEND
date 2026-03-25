export interface DispatchOrderView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  branch: { id: number; name: string | null } | null;
  dispatch_type: string;
  status: string;
  route_id: number | null;
  route: { id: number; code: string | null; name: string } | null;
  vehicle_id: number | null;
  vehicle:
    | {
        id: number;
        code: string | null;
        name: string;
        plate_number: string;
      }
    | null;
  driver_user_id: number | null;
  driver_user: { id: number; name: string } | null;
  origin_warehouse_id: number | null;
  origin_warehouse: { id: number; name: string } | null;
  scheduled_date: string | null;
  dispatched_at: Date | null;
  completed_at: Date | null;
  notes: string | null;
  created_by_user_id: number;
  created_by_user: { id: number; name: string } | null;
  stops: Array<{
    id: number;
    sale_order_id: number;
    sale_order:
      | {
          id: number;
          code: string | null;
          status: string;
          dispatch_status: string;
        }
      | null;
    customer_contact_id: number;
    customer_contact: { id: number; name: string } | null;
    delivery_sequence: number;
    delivery_address: string | null;
    delivery_province: string | null;
    delivery_canton: string | null;
    delivery_district: string | null;
    status: string;
    delivered_at: Date | null;
    received_by: string | null;
    failure_reason: string | null;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }>;
  expenses: Array<{
    id: number;
    expense_type: string;
    description: string | null;
    amount: number;
    receipt_number: string | null;
    notes: string | null;
    created_by_user_id: number;
    created_by_user: { id: number; name: string } | null;
    created_at: Date;
    updated_at: Date;
  }>;
  lifecycle: {
    can_ready: boolean;
    can_edit: boolean;
    can_dispatch: boolean;
    can_complete: boolean;
    can_cancel: boolean;
  };
  created_at: Date;
  updated_at: Date;
}
