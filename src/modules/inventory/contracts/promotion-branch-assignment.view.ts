import { PromotionType } from '../enums/promotion-type.enum';

export interface PromotionBranchAssignmentView {
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
  promotion: {
    id: number;
    code?: string | null;
    name?: string;
    type?: PromotionType;
    valid_from?: Date;
    valid_to?: Date;
    is_active?: boolean;
  };
  is_active: boolean;
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
