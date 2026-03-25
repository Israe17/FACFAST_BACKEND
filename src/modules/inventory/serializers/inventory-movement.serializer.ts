import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import {
  CancelInventoryMovementResultView,
  InventoryMovementRecordView,
  LegacyInventoryMovementView,
} from '../contracts/inventory-movement.view';
import { InventoryMovementHeader } from '../entities/inventory-movement-header.entity';
import { InventoryMovementLine } from '../entities/inventory-movement-line.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';

@Injectable()
export class InventoryMovementSerializer
  implements EntitySerializer<InventoryMovementHeader, InventoryMovementRecordView>
{
  serialize(
    movement_header: InventoryMovementHeader,
  ): InventoryMovementRecordView {
    return this.serialize_record(movement_header);
  }

  serialize_legacy_movement(
    movement: InventoryMovement,
  ): LegacyInventoryMovementView {
    return {
      id: movement.id,
      code: movement.code,
      business_id: movement.business_id,
      branch_id: movement.branch_id,
      warehouse: movement.warehouse
        ? {
            id: movement.warehouse.id,
            code: movement.warehouse.code,
            name: movement.warehouse.name,
          }
        : {
            id: movement.warehouse_id,
          },
      location: movement.location
        ? {
            id: movement.location.id,
            code: movement.location.code,
            name: movement.location.name,
          }
        : null,
      product: movement.product
        ? {
            id: movement.product.id,
            code: movement.product.code,
            name: movement.product.name,
          }
        : {
            id: movement.product_id,
          },
      inventory_lot: movement.inventory_lot
        ? {
            id: movement.inventory_lot.id,
            code: movement.inventory_lot.code,
            lot_number: movement.inventory_lot.lot_number,
          }
        : null,
      movement_type: movement.movement_type,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      quantity: movement.quantity,
      previous_quantity: movement.previous_quantity,
      new_quantity: movement.new_quantity,
      notes: movement.notes,
      created_by: movement.created_by_user
        ? {
            id: movement.created_by_user.id,
            code: movement.created_by_user.code,
            name: movement.created_by_user.name,
            email: movement.created_by_user.email,
          }
        : {
            id: movement.created_by,
          },
      created_at: movement.created_at,
    };
  }

  serialize_record(
    movement_header: InventoryMovementHeader,
    meta?: {
      legacy_movement_ids?: number[];
      legacy_movements?: InventoryMovement[] | LegacyInventoryMovementView[];
      transferred_serial_ids?: number[];
    },
  ): InventoryMovementRecordView {
    const lines = [...(movement_header.lines ?? [])]
      .sort((left, right) => left.line_no - right.line_no)
      .map((movement_line) => this.serialize_line(movement_line));

    const legacy_movements = (meta?.legacy_movements ?? []).map((movement) =>
      'created_by_user' in movement ||
      'warehouse_id' in movement ||
      'product_id' in movement
        ? this.serialize_legacy_movement(movement as InventoryMovement)
        : (movement as LegacyInventoryMovementView),
    );

    return {
      id: movement_header.id,
      code: movement_header.code,
      business_id: movement_header.business_id,
      branch_id: movement_header.branch_id,
      branch: movement_header.branch
        ? {
            id: movement_header.branch.id,
            code: movement_header.branch.code,
            business_name: movement_header.branch.business_name,
          }
        : null,
      movement_type: movement_header.movement_type,
      status: movement_header.status,
      source_document_type: movement_header.source_document_type,
      source_document_id: movement_header.source_document_id,
      source_document_number: movement_header.source_document_number,
      notes: movement_header.notes,
      occurred_at: movement_header.occurred_at,
      performed_by: movement_header.performed_by_user
        ? {
            id: movement_header.performed_by_user.id,
            code: movement_header.performed_by_user.code,
            name: movement_header.performed_by_user.name,
            email: movement_header.performed_by_user.email,
          }
        : {
            id: movement_header.performed_by_user_id,
          },
      line_count: lines.length,
      lines,
      legacy_movement_ids: meta?.legacy_movement_ids ?? [],
      legacy_movements,
      transferred_serial_ids: meta?.transferred_serial_ids ?? [],
      created_at: movement_header.created_at,
      updated_at: movement_header.updated_at,
    };
  }

  serialize_cancel_result(
    cancelled_movement: InventoryMovementHeader,
    compensating_movement: InventoryMovementHeader,
    options: {
      legacy_movement_ids: number[];
    },
  ): CancelInventoryMovementResultView {
    return {
      success: true,
      cancelled_movement: this.serialize_record(cancelled_movement),
      compensating_movement: this.serialize_record(compensating_movement, {
        legacy_movement_ids: options.legacy_movement_ids,
      }),
    };
  }

  private serialize_line(
    movement_line: InventoryMovementLine,
  ): InventoryMovementRecordView['lines'][number] {
    const product = movement_line.product_variant?.product;

    return {
      id: movement_line.id,
      line_no: movement_line.line_no,
      warehouse: movement_line.warehouse
        ? {
            id: movement_line.warehouse.id,
            code: movement_line.warehouse.code,
            name: movement_line.warehouse.name,
          }
        : {
            id: movement_line.warehouse_id,
          },
      location: movement_line.location
        ? {
            id: movement_line.location.id,
            code: movement_line.location.code,
            name: movement_line.location.name,
          }
        : movement_line.location_id !== null
          ? { id: movement_line.location_id }
          : null,
      inventory_lot: movement_line.inventory_lot
        ? {
            id: movement_line.inventory_lot.id,
            code: movement_line.inventory_lot.code,
            lot_number: movement_line.inventory_lot.lot_number,
          }
        : movement_line.inventory_lot_id !== null
          ? { id: movement_line.inventory_lot_id }
          : null,
      product_variant: movement_line.product_variant
        ? {
            id: movement_line.product_variant.id,
            sku: movement_line.product_variant.sku,
            barcode: movement_line.product_variant.barcode,
            variant_name: movement_line.product_variant.variant_name,
            is_default: movement_line.product_variant.is_default,
          }
        : null,
      product: product
        ? {
            id: product.id,
            code: product.code,
            name: product.name,
            type: product.type,
          }
        : {
            id: movement_line.product_variant?.product_id ?? null,
          },
      quantity: movement_line.quantity,
      unit_cost: movement_line.unit_cost,
      total_cost: movement_line.total_cost,
      on_hand_delta: movement_line.on_hand_delta,
      reserved_delta: movement_line.reserved_delta,
      incoming_delta: movement_line.incoming_delta,
      outgoing_delta: movement_line.outgoing_delta,
      linked_line_id: movement_line.linked_line_id,
      created_at: movement_line.created_at,
      updated_at: movement_line.updated_at,
    };
  }
}
