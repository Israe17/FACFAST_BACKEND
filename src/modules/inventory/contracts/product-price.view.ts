import { PriceListKind } from '../enums/price-list-kind.enum';

export interface ProductPriceView {
  id: number;
  business_id: number;
  product_id: number;
  product_variant_id: number | null;
  product_variant: {
    id: number;
    sku: string;
    variant_name: string | null;
    is_default: boolean;
  } | null;
  price_list_id: number;
  price_list: {
    id: number;
    code: string | null;
    name: string;
    kind: PriceListKind;
    currency: string;
  } | null;
  price: number;
  min_quantity: number | null;
  valid_from: Date | null;
  valid_to: Date | null;
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
