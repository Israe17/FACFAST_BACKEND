import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { InventoryLot } from '../entities/inventory-lot.entity';

@Injectable()
export class InventoryLotSerializer
  implements EntitySerializer<InventoryLot, InventoryLotView>
{
  serialize(lot: InventoryLot): InventoryLotView {
    return {
      id: lot.id,
      code: lot.code,
      business_id: lot.business_id,
      branch_id: lot.branch_id,
      warehouse: lot.warehouse
        ? {
            id: lot.warehouse.id,
            code: lot.warehouse.code,
            name: lot.warehouse.name,
          }
        : {
            id: lot.warehouse_id,
          },
      location: lot.location
        ? {
            id: lot.location.id,
            code: lot.location.code,
            name: lot.location.name,
          }
        : null,
      product: lot.product
        ? {
            id: lot.product.id,
            code: lot.product.code,
            name: lot.product.name,
          }
        : {
            id: lot.product_id,
          },
      product_variant: lot.product_variant
        ? {
            id: lot.product_variant.id,
            sku: lot.product_variant.sku,
            variant_name: lot.product_variant.variant_name,
            is_default: lot.product_variant.is_default,
          }
        : null,
      lot_number: lot.lot_number,
      expiration_date: lot.expiration_date,
      manufacturing_date: lot.manufacturing_date,
      received_at: lot.received_at,
      initial_quantity: lot.initial_quantity,
      current_quantity: lot.current_quantity,
      unit_cost: lot.unit_cost,
      supplier_contact: lot.supplier_contact
        ? {
            id: lot.supplier_contact.id,
            code: lot.supplier_contact.code,
            name: lot.supplier_contact.name,
          }
        : null,
      is_active: lot.is_active,
      lifecycle: {
        can_delete: false,
        can_deactivate: lot.is_active,
        can_reactivate: !lot.is_active,
        reasons: ['hard_delete_not_supported'],
      },
      created_at: lot.created_at,
      updated_at: lot.updated_at,
    };
  }
}
