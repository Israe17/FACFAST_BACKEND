export interface WarehouseView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  branch: {
    id: number;
    code: string | null;
    name: string | null;
    business_name: string;
    branch_number: string;
  } | null;
  name: string;
  description: string | null;
  purpose: string;
  uses_locations: boolean;
  is_default: boolean;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
