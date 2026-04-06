export interface SaleOrderView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  branch?: { id: number; name: string | null };
  customer_contact_id: number;
  customer_contact?: { id: number; name: string };
  seller_user_id: number | null;
  seller: { id: number; name: string } | null;
  sale_mode: string;
  fulfillment_mode: string;
  status: string;
  dispatch_status: string;
  order_date: Date;
  delivery_address: string | null;
  delivery_province: string | null;
  delivery_canton: string | null;
  delivery_district: string | null;
  delivery_zone_id: number | null;
  delivery_zone: { id: number; name: string } | null;
  delivery_requested_date: string | null;
  warehouse_id: number | null;
  warehouse: { id: number; name: string } | null;
  notes: string | null;
  internal_notes: string | null;
  created_by_user_id: number;
  created_by_user?: { id: number; name: string };
  lines: Array<{
    id: number;
    line_no: number;
    product_variant_id: number;
    product_variant?:
      | {
          id: number;
          variant_name: string | null;
          sku: string;
          product?: {
            id: number;
            name: string;
          };
        }
      | undefined;
    quantity: number;
    unit_price: number;
    discount_percent: number;
    tax_amount: number;
    line_total: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }>;
  delivery_charges: Array<{
    id: number;
    charge_type: string;
    amount: number;
    notes: string | null;
    created_at: Date;
    updated_at: Date;
  }>;
  lifecycle: {
    can_edit: boolean;
    can_confirm: boolean;
    can_cancel: boolean;
    can_delete: boolean;
    can_reset_dispatch: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
