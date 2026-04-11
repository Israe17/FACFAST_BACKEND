import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  CancelInventoryMovementResultView,
  InventoryMovementRecordView,
} from '../contracts/inventory-movement.view';
import { CancelInventoryMovementDto } from '../dto/cancel-inventory-movement.dto';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { AdjustInventoryUseCase } from '../use-cases/adjust-inventory.use-case';
import { CancelInventoryMovementUseCase } from '../use-cases/cancel-inventory-movement.use-case';
import { GetInventoryMovementsCursorQueryUseCase } from '../use-cases/get-inventory-movements-cursor.query.use-case';
import { GetInventoryMovementQueryUseCase } from '../use-cases/get-inventory-movement.query.use-case';
import { GetInventoryMovementsListQueryUseCase } from '../use-cases/get-inventory-movements-list.query.use-case';
import { GetInventoryMovementsPageQueryUseCase } from '../use-cases/get-inventory-movements-page.query.use-case';
import { TransferInventoryUseCase } from '../use-cases/transfer-inventory.use-case';

@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly get_inventory_movements_list_query_use_case: GetInventoryMovementsListQueryUseCase,
    private readonly get_inventory_movements_page_query_use_case: GetInventoryMovementsPageQueryUseCase,
    private readonly get_inventory_movements_cursor_query_use_case: GetInventoryMovementsCursorQueryUseCase,
    private readonly get_inventory_movement_query_use_case: GetInventoryMovementQueryUseCase,
    private readonly adjust_inventory_use_case: AdjustInventoryUseCase,
    private readonly transfer_inventory_use_case: TransferInventoryUseCase,
    private readonly cancel_inventory_movement_use_case: CancelInventoryMovementUseCase,
  ) {}

  async get_movements(
    current_user: AuthenticatedUserContext,
  ): Promise<InventoryMovementRecordView[]> {
    return this.get_inventory_movements_list_query_use_case.execute({
      current_user,
    });
  }

  async get_movements_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
    filters?: {
      source_document_type?: string;
      source_document_id?: number;
    },
  ) {
    return this.get_inventory_movements_page_query_use_case.execute({
      current_user,
      query,
      filters,
    });
  }

  async get_movements_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<InventoryMovementRecordView>> {
    return this.get_inventory_movements_cursor_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_movement(
    current_user: AuthenticatedUserContext,
    movement_id: number,
  ): Promise<InventoryMovementRecordView> {
    return this.get_inventory_movement_query_use_case.execute({
      current_user,
      inventory_movement_id: movement_id,
    });
  }

  async adjust_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryAdjustmentDto,
  ): Promise<InventoryMovementRecordView> {
    return this.adjust_inventory_use_case.execute({
      current_user,
      dto,
    });
  }

  async transfer_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryTransferDto,
  ): Promise<InventoryMovementRecordView> {
    return this.transfer_inventory_use_case.execute({
      current_user,
      dto,
    });
  }

  async cancel_movement(
    current_user: AuthenticatedUserContext,
    movement_id: number,
    dto: CancelInventoryMovementDto,
    idempotency_key?: string | null,
  ): Promise<CancelInventoryMovementResultView> {
    return this.cancel_inventory_movement_use_case.execute({
      current_user,
      inventory_movement_id: movement_id,
      dto,
      idempotency_key,
    });
  }
}
