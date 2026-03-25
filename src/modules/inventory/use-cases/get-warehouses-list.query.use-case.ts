import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseView } from '../contracts/warehouse.view';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { WarehouseSerializer } from '../serializers/warehouse.serializer';

export type GetWarehousesListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetWarehousesListQueryUseCase
  implements QueryUseCase<GetWarehousesListQuery, WarehouseView[]>
{
  constructor(
    private readonly warehouses_repository: WarehousesRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouse_serializer: WarehouseSerializer,
  ) {}

  async execute({
    current_user,
  }: GetWarehousesListQuery): Promise<WarehouseView[]> {
    const warehouses = await this.warehouses_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
    );

    return warehouses.map((warehouse) =>
      this.warehouse_serializer.serialize(warehouse),
    );
  }
}
