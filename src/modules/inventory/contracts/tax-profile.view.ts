import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';

export interface TaxProfileView {
  id: number;
  code: string | null;
  business_id: number;
  name: string;
  description: string | null;
  cabys_code: string;
  item_kind: TaxProfileItemKind;
  tax_type: TaxType;
  iva_rate_code: string | null;
  iva_rate: number | null;
  requires_cabys: boolean;
  allows_exoneration: boolean;
  has_specific_tax: boolean;
  specific_tax_name: string | null;
  specific_tax_rate: number | null;
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
