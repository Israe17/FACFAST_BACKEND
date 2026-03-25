import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { WarehouseView } from '../contracts/warehouse.view';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseSerializer } from '../serializers/warehouse.serializer';

export type GetWarehouseQuery = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
};

@Injectable()
export class GetWarehouseQueryUseCase
  implements QueryUseCase<GetWarehouseQuery, WarehouseView>
{
  constructor(
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouse_serializer: WarehouseSerializer,
  ) {}

  async execute({
    current_user,
    warehouse_id,
  }: GetWarehouseQuery): Promise<WarehouseView> {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    return this.warehouse_serializer.serialize(warehouse);
  }
}
