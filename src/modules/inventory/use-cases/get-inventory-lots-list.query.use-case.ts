import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryLotSerializer } from '../serializers/inventory-lot.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type GetInventoryLotsListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetInventoryLotsListQueryUseCase
  implements QueryUseCase<GetInventoryLotsListQuery, InventoryLotView[]>
{
  constructor(
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_lot_serializer: InventoryLotSerializer,
  ) {}

  async execute({
    current_user,
  }: GetInventoryLotsListQuery): Promise<InventoryLotView[]> {
    const lots = await this.inventory_lots_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
    );

    return lots.map((lot) => this.inventory_lot_serializer.serialize(lot));
  }
}
