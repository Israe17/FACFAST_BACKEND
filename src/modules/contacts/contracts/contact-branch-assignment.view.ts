import { PriceListKind } from '../../inventory/enums/price-list-kind.enum';

export interface ContactBranchAssignmentView {
  id: number;
  business_id: number;
  contact_id: number;
  branch: {
    id: number;
    code?: string | null;
    name?: string | null;
    business_name?: string;
    branch_number?: string;
    is_active?: boolean;
  };
  is_active: boolean;
  is_default: boolean;
  is_preferred: boolean;
  is_exclusive: boolean;
  sales_enabled: boolean;
  purchases_enabled: boolean;
  credit_enabled: boolean;
  custom_credit_limit: number | null;
  custom_price_list: {
    id: number;
    code?: string | null;
    name?: string;
    kind?: PriceListKind;
    currency?: string;
    is_active?: boolean;
  } | null;
  account_manager: {
    id: number;
    code?: string | null;
    name?: string;
    email?: string;
    status?: string;
  } | null;
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
