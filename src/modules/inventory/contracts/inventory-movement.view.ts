export interface LegacyInventoryMovementView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  warehouse: {
    id: number;
    code?: string | null;
    name?: string;
  };
  location: {
    id: number;
    code?: string | null;
    name?: string;
  } | null;
  product: {
    id: number;
    code?: string | null;
    name?: string;
  };
  inventory_lot: {
    id: number;
    code?: string | null;
    lot_number?: string;
  } | null;
  movement_type: string;
  reference_type: string | null;
  reference_id: number | null;
  quantity: number;
  previous_quantity: number;
  new_quantity: number;
  notes: string | null;
  created_by: {
    id: number;
    code?: string | null;
    name?: string;
    email?: string;
  };
  created_at: Date;
}

export interface InventoryMovementLineView {
  id: number;
  line_no: number;
  warehouse: {
    id: number;
    code?: string | null;
    name?: string;
  };
  location: {
    id: number;
    code?: string | null;
    name?: string;
  } | null;
  inventory_lot: {
    id: number;
    code?: string | null;
    lot_number?: string;
  } | null;
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
  unit_cost: number | null;
  total_cost: number | null;
  on_hand_delta: number;
  reserved_delta: number;
  incoming_delta: number;
  outgoing_delta: number;
  linked_line_id: number | null;
  created_at: Date;
  updated_at: Date;
}

export interface InventoryMovementRecordView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number | null;
  branch: {
    id: number;
    code?: string | null;
    business_name?: string;
  } | null;
  movement_type: string;
  status: string;
  source_document_type: string | null;
  source_document_id: number | null;
  source_document_number: string | null;
  notes: string | null;
  occurred_at: Date;
  performed_by: {
    id: number;
    code?: string | null;
    name?: string;
    email?: string;
  };
  line_count: number;
  lines: InventoryMovementLineView[];
  legacy_movement_ids: number[];
  legacy_movements: LegacyInventoryMovementView[];
  transferred_serial_ids: number[];
  created_at: Date;
  updated_at: Date;
}

export interface CancelInventoryMovementResultView {
  success: true;
  cancelled_movement: InventoryMovementRecordView;
  compensating_movement: InventoryMovementRecordView;
}
