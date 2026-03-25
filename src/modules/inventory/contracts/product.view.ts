import { ProductType } from '../enums/product-type.enum';

export interface ProductView {
  id: number;
  code: string | null;
  business_id: number;
  type: ProductType;
  name: string;
  description: string | null;
  category:
    | {
        id: number;
        code: string | null;
        name: string;
      }
    | null;
  brand:
    | {
        id: number;
        code: string | null;
        name: string;
      }
    | null;
  sku: string | null;
  barcode: string | null;
  stock_unit:
    | {
        id: number;
        code: string | null;
        name: string;
        symbol: string;
      }
    | null;
  sale_unit:
    | {
        id: number;
        code: string | null;
        name: string;
        symbol: string;
      }
    | null;
  tax_profile:
    | {
        id: number;
        code: string | null;
        name: string;
        item_kind: string;
        tax_type: string;
        cabys_code: string;
      }
    | null;
  track_inventory: boolean;
  track_lots: boolean;
  track_expiration: boolean;
  track_serials: boolean;
  allow_negative_stock: boolean;
  has_variants: boolean;
  has_warranty: boolean;
  warranty_profile:
    | {
        id: number;
        code: string | null;
        name: string;
      }
    | null;
  variants: Array<{
    id: number;
    sku: string | null;
    barcode: string | null;
    variant_name: string;
    is_default: boolean;
    is_active: boolean;
    track_serials: boolean;
    track_inventory: boolean;
    allow_negative_stock: boolean;
  }>;
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
