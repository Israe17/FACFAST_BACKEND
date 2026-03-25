import { PriceListKind } from '../enums/price-list-kind.enum';

export interface PriceListBranchAssignmentView {
  id: number;
  business_id: number;
  branch: {
    id: number;
    code?: string | null;
    name?: string | null;
    business_name?: string;
    branch_number?: string;
    is_active?: boolean;
  };
  price_list: {
    id: number;
    code?: string | null;
    name?: string;
    kind?: PriceListKind;
    currency?: string;
    is_default?: boolean;
    is_active?: boolean;
  };
  is_active: boolean;
  is_default: boolean;
  notes: string | null;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
