import { PriceListKind } from '../enums/price-list-kind.enum';

export interface PriceListView {
  id: number;
  code: string | null;
  business_id: number;
  name: string;
  kind: PriceListKind;
  currency: string;
  is_default: boolean;
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
