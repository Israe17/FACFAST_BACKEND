export interface WarehouseLocationView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  warehouse_id: number;
  name: string;
  description: string | null;
  zone: string | null;
  aisle: string | null;
  rack: string | null;
  level: string | null;
  position: string | null;
  barcode: string | null;
  is_picking_area: boolean;
  is_receiving_area: boolean;
  is_dispatch_area: boolean;
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
