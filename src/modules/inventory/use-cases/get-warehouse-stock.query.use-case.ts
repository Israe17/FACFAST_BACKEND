import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseStockView } from '../contracts/warehouse-stock.view';
import { InventoryBalancesRepository } from '../repositories/inventory-balances.repository';
import { WarehouseStockRepository } from '../repositories/warehouse-stock.repository';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseStockProjectionService } from '../services/warehouse-stock-projection.service';

export type GetWarehouseStockQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetWarehouseStockQueryUseCase
  implements QueryUseCase<GetWarehouseStockQuery, WarehouseStockView[]>
{
  constructor(
    private readonly inventory_balances_repository: InventoryBalancesRepository,
    private readonly warehouse_stock_repository: WarehouseStockRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouse_stock_projection_service: WarehouseStockProjectionService,
  ) {}

  async execute({
    current_user,
  }: GetWarehouseStockQuery): Promise<WarehouseStockView[]> {
    const business_id = resolve_effective_business_id(current_user);
    const accessible_branch_ids =
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      );
    const balances =
      await this.inventory_balances_repository.find_all_by_business(
        business_id,
        accessible_branch_ids,
      );
    const legacy_stock =
      await this.warehouse_stock_repository.find_legacy_settings_by_keys(
        business_id,
        this.warehouse_stock_projection_service.build_legacy_lookup_keys(
          balances,
        ),
      );

    return this.warehouse_stock_projection_service.serialize_balances(
      balances,
      legacy_stock,
    );
  }
}
