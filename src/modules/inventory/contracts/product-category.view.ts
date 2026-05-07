import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';

export interface ProductCategoryDefaultTaxProfileView {
  id: number;
  name: string;
  cabys_code: string | null;
  description: string | null;
  iva_rate: number | null;
  item_kind: TaxProfileItemKind;
}

export interface ProductCategoryView {
  id: number;
  code: string | null;
  business_id: number;
  name: string;
  description: string | null;
  parent_id: number | null;
  level: number | null;
  path: string | null;
  default_tax_profile_id: number | null;
  default_tax_profile: ProductCategoryDefaultTaxProfileView | null;
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

export interface ProductCategoryTreeNode extends ProductCategoryView {
  children: ProductCategoryTreeNode[];
}
