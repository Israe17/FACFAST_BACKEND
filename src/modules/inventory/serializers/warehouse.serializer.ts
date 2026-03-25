import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { WarehouseView } from '../contracts/warehouse.view';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class WarehouseSerializer
  implements EntitySerializer<Warehouse, WarehouseView>
{
  serialize(warehouse: Warehouse): WarehouseView {
    return {
      id: warehouse.id,
      code: warehouse.code,
      business_id: warehouse.business_id,
      branch_id: warehouse.branch_id,
      name: warehouse.name,
      description: warehouse.description,
      purpose: warehouse.purpose,
      uses_locations: warehouse.uses_locations,
      is_default: warehouse.is_default,
      is_active: warehouse.is_active,
      lifecycle: {
        can_delete: false,
        can_deactivate: warehouse.is_active,
        can_reactivate: !warehouse.is_active,
        reasons: ['hard_delete_not_supported'],
      },
      created_at: warehouse.created_at,
      updated_at: warehouse.updated_at,
    };
  }
}
