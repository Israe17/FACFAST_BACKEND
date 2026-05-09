export interface WarehouseStockThresholdsView {
  warehouse_id: number;
  product_variant_id: number;
  product_id: number;
  min_stock: number | null;
  max_stock: number | null;
  updated_at: Date;
}
