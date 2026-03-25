import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { CreateInventoryLotDto } from '../dto/create-inventory-lot.dto';
import { UpdateInventoryLotDto } from '../dto/update-inventory-lot.dto';
import { CreateInventoryLotUseCase } from '../use-cases/create-inventory-lot.use-case';
import { DeactivateInventoryLotUseCase } from '../use-cases/deactivate-inventory-lot.use-case';
import { GetInventoryLotsCursorQueryUseCase } from '../use-cases/get-inventory-lots-cursor.query.use-case';
import { GetInventoryLotQueryUseCase } from '../use-cases/get-inventory-lot.query.use-case';
import { GetInventoryLotsListQueryUseCase } from '../use-cases/get-inventory-lots-list.query.use-case';
import { GetInventoryLotsPageQueryUseCase } from '../use-cases/get-inventory-lots-page.query.use-case';
import { UpdateInventoryLotUseCase } from '../use-cases/update-inventory-lot.use-case';

@Injectable()
export class InventoryLotsService {
  constructor(
    private readonly get_inventory_lots_list_query_use_case: GetInventoryLotsListQueryUseCase,
    private readonly get_inventory_lots_page_query_use_case: GetInventoryLotsPageQueryUseCase,
    private readonly get_inventory_lots_cursor_query_use_case: GetInventoryLotsCursorQueryUseCase,
    private readonly get_inventory_lot_query_use_case: GetInventoryLotQueryUseCase,
    private readonly create_inventory_lot_use_case: CreateInventoryLotUseCase,
    private readonly update_inventory_lot_use_case: UpdateInventoryLotUseCase,
    private readonly deactivate_inventory_lot_use_case: DeactivateInventoryLotUseCase,
  ) {}

  async get_lots(
    current_user: AuthenticatedUserContext,
  ): Promise<InventoryLotView[]> {
    return this.get_inventory_lots_list_query_use_case.execute({
      current_user,
    });
  }

  async get_lots_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    return this.get_inventory_lots_page_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_lots_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<InventoryLotView>> {
    return this.get_inventory_lots_cursor_query_use_case.execute({
      current_user,
      query,
    });
  }

  async create_lot(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryLotDto,
  ): Promise<InventoryLotView> {
    return this.create_inventory_lot_use_case.execute({
      current_user,
      dto,
    });
  }

  async get_lot(
    current_user: AuthenticatedUserContext,
    lot_id: number,
  ): Promise<InventoryLotView> {
    return this.get_inventory_lot_query_use_case.execute({
      current_user,
      inventory_lot_id: lot_id,
    });
  }

  async update_lot(
    current_user: AuthenticatedUserContext,
    lot_id: number,
    dto: UpdateInventoryLotDto,
  ): Promise<InventoryLotView> {
    return this.update_inventory_lot_use_case.execute({
      current_user,
      inventory_lot_id: lot_id,
      dto,
    });
  }

  async deactivate_lot(
    current_user: AuthenticatedUserContext,
    lot_id: number,
  ): Promise<InventoryLotView> {
    return this.deactivate_inventory_lot_use_case.execute({
      current_user,
      inventory_lot_id: lot_id,
    });
  }
}
