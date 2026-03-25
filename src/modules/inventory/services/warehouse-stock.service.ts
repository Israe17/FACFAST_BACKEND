import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { WarehouseStockView } from '../contracts/warehouse-stock.view';
import { GetWarehouseStockByWarehouseCursorQueryUseCase } from '../use-cases/get-warehouse-stock-by-warehouse-cursor.query.use-case';
import { GetWarehouseStockByWarehouseQueryUseCase } from '../use-cases/get-warehouse-stock-by-warehouse.query.use-case';
import { GetWarehouseStockCursorQueryUseCase } from '../use-cases/get-warehouse-stock-cursor.query.use-case';
import { GetWarehouseStockQueryUseCase } from '../use-cases/get-warehouse-stock.query.use-case';

@Injectable()
export class WarehouseStockService {
  constructor(
    private readonly get_warehouse_stock_query_use_case: GetWarehouseStockQueryUseCase,
    private readonly get_warehouse_stock_cursor_query_use_case: GetWarehouseStockCursorQueryUseCase,
    private readonly get_warehouse_stock_by_warehouse_query_use_case: GetWarehouseStockByWarehouseQueryUseCase,
    private readonly get_warehouse_stock_by_warehouse_cursor_query_use_case: GetWarehouseStockByWarehouseCursorQueryUseCase,
  ) {}

  async get_stock(
    current_user: AuthenticatedUserContext,
  ): Promise<WarehouseStockView[]> {
    return this.get_warehouse_stock_query_use_case.execute({ current_user });
  }

  async get_stock_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<WarehouseStockView>> {
    return this.get_warehouse_stock_cursor_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_stock_by_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<WarehouseStockView[]> {
    return this.get_warehouse_stock_by_warehouse_query_use_case.execute({
      current_user,
      warehouse_id,
    });
  }

  async get_stock_by_warehouse_cursor(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<WarehouseStockView>> {
    return this.get_warehouse_stock_by_warehouse_cursor_query_use_case.execute({
      current_user,
      warehouse_id,
      query,
    });
  }
}
