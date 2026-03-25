import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { WarehouseView } from '../contracts/warehouse.view';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { WarehouseSerializer } from '../serializers/warehouse.serializer';

export type DeactivateWarehouseCommand = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
};

@Injectable()
export class DeactivateWarehouseUseCase
  implements CommandUseCase<DeactivateWarehouseCommand, WarehouseView>
{
  constructor(
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouses_repository: WarehousesRepository,
    private readonly warehouse_serializer: WarehouseSerializer,
  ) {}

  async execute({
    current_user,
    warehouse_id,
  }: DeactivateWarehouseCommand): Promise<WarehouseView> {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    warehouse.is_active = false;
    const saved = await this.warehouses_repository.save(warehouse);
    return this.warehouse_serializer.serialize(saved);
  }
}
