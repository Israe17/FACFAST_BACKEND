import { PromotionType } from '../enums/promotion-type.enum';

export interface PromotionView {
  id: number;
  code: string | null;
  business_id: number;
  name: string;
  type: PromotionType;
  valid_from: Date;
  valid_to: Date;
  is_active: boolean;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  items: Array<{
    id: number;
    product: {
      id: number;
      code?: string | null;
      name?: string;
    };
    product_variant: {
      id: number;
      sku: string | null;
      variant_name: string | null;
      is_default: boolean;
    } | null;
    min_quantity: number | null;
    discount_value: number | null;
    override_price: number | null;
    bonus_quantity: number | null;
  }>;
  created_at: Date;
  updated_at: Date;
}
