import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { WarehouseLocationView } from '../contracts/warehouse-location.view';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseLocationSerializer } from '../serializers/warehouse-location.serializer';

export type GetWarehouseLocationQuery = {
  current_user: AuthenticatedUserContext;
  location_id: number;
};

@Injectable()
export class GetWarehouseLocationQueryUseCase
  implements QueryUseCase<GetWarehouseLocationQuery, WarehouseLocationView>
{
  constructor(
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouse_location_serializer: WarehouseLocationSerializer,
  ) {}

  async execute({
    current_user,
    location_id,
  }: GetWarehouseLocationQuery): Promise<WarehouseLocationView> {
    const location =
      await this.inventory_validation_service.get_location_for_operation(
        current_user,
        location_id,
      );
    return this.warehouse_location_serializer.serialize(location);
  }
}
