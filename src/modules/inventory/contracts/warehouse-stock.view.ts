export interface WarehouseStockView {
  id: number;
  business_id: number;
  branch_id: number | null;
  warehouse: {
    id: number;
    code?: string | null;
    name?: string;
  };
  product_variant:
    | {
        id: number;
        sku: string | null;
        barcode: string | null;
        variant_name: string | null;
        is_default: boolean;
      }
    | null;
  product: {
    id: number | null;
    code?: string | null;
    name?: string;
    type?: string;
  };
  quantity: number;
  reserved_quantity: number;
  incoming_quantity: number;
  outgoing_quantity: number;
  available_quantity: number;
  projected_quantity: number;
  min_stock: number | null;
  max_stock: number | null;
  updated_at: Date;
}
