export interface InventoryLotView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  warehouse: {
    id: number;
    code?: string | null;
    name?: string;
  };
  location: {
    id: number;
    code?: string | null;
    name?: string;
  } | null;
  product: {
    id: number;
    code?: string | null;
    name?: string;
  };
  product_variant:
    | {
        id: number;
        sku: string | null;
        variant_name: string | null;
        is_default: boolean;
      }
    | null;
  lot_number: string;
  expiration_date: string | null;
  manufacturing_date: string | null;
  received_at: Date | null;
  initial_quantity: number;
  current_quantity: number;
  unit_cost: number | null;
  supplier_contact:
    | {
        id: number;
        code?: string | null;
        name?: string;
      }
    | null;
  is_active: boolean;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
