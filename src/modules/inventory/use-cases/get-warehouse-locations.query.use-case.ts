import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseLocationView } from '../contracts/warehouse-location.view';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseLocationsRepository } from '../repositories/warehouse-locations.repository';
import { WarehouseLocationSerializer } from '../serializers/warehouse-location.serializer';

export type GetWarehouseLocationsQuery = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
};

@Injectable()
export class GetWarehouseLocationsQueryUseCase
  implements QueryUseCase<GetWarehouseLocationsQuery, WarehouseLocationView[]>
{
  constructor(
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouse_locations_repository: WarehouseLocationsRepository,
    private readonly warehouse_location_serializer: WarehouseLocationSerializer,
  ) {}

  async execute({
    current_user,
    warehouse_id,
  }: GetWarehouseLocationsQuery): Promise<WarehouseLocationView[]> {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    const locations =
      await this.warehouse_locations_repository.find_all_by_warehouse_in_business(
        warehouse.id,
        resolve_effective_business_id(current_user),
      );

    return locations.map((location) =>
      this.warehouse_location_serializer.serialize(location),
    );
  }
}
