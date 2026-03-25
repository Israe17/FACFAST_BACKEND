import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { WarehouseLocationView } from '../contracts/warehouse-location.view';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Injectable()
export class WarehouseLocationSerializer
  implements EntitySerializer<WarehouseLocation, WarehouseLocationView>
{
  serialize(location: WarehouseLocation): WarehouseLocationView {
    return {
      id: location.id,
      code: location.code,
      business_id: location.business_id,
      branch_id: location.branch_id,
      warehouse_id: location.warehouse_id,
      name: location.name,
      description: location.description,
      zone: location.zone,
      aisle: location.aisle,
      rack: location.rack,
      level: location.level,
      position: location.position,
      barcode: location.barcode,
      is_picking_area: location.is_picking_area,
      is_receiving_area: location.is_receiving_area,
      is_dispatch_area: location.is_dispatch_area,
      is_active: location.is_active,
      lifecycle: {
        can_delete: false,
        can_deactivate: location.is_active,
        can_reactivate: !location.is_active,
        reasons: ['hard_delete_not_supported'],
      },
      created_at: location.created_at,
      updated_at: location.updated_at,
    };
  }
}
