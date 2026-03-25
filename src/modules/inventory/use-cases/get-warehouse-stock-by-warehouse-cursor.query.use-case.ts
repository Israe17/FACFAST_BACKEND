import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseStockView } from '../contracts/warehouse-stock.view';
import { InventoryBalancesRepository } from '../repositories/inventory-balances.repository';
import { WarehouseStockRepository } from '../repositories/warehouse-stock.repository';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseStockProjectionService } from '../services/warehouse-stock-projection.service';

export type GetWarehouseStockByWarehouseCursorQuery = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
  query: CursorQueryDto;
};

@Injectable()
export class GetWarehouseStockByWarehouseCursorQueryUseCase
  implements
    QueryUseCase<
      GetWarehouseStockByWarehouseCursorQuery,
      CursorResponseDto<WarehouseStockView>
    >
{
  constructor(
    private readonly inventory_balances_repository: InventoryBalancesRepository,
    private readonly warehouse_stock_repository: WarehouseStockRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly warehouse_stock_projection_service: WarehouseStockProjectionService,
  ) {}

  async execute({
    current_user,
    warehouse_id,
    query,
  }: GetWarehouseStockByWarehouseCursorQuery): Promise<
    CursorResponseDto<WarehouseStockView>
  > {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    const business_id = resolve_effective_business_id(current_user);
    const page = await this.inventory_balances_repository.find_cursor_by_warehouse(
      business_id,
      warehouse.id,
      query,
      (balance) => balance,
    );
    const legacy_stock = await this.warehouse_stock_repository.find_legacy_settings_by_keys(
      business_id,
      this.warehouse_stock_projection_service.build_legacy_lookup_keys(
        page.data,
      ),
    );

    return new CursorResponseDto(
      this.warehouse_stock_projection_service.serialize_balances(
        page.data,
        legacy_stock,
      ),
      page.next_cursor,
      page.has_more,
    );
  }
}
