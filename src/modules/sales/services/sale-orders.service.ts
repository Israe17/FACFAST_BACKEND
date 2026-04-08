import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CancelSaleOrderDto } from '../dto/cancel-sale-order.dto';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from '../dto/update-sale-order.dto';
import { SaleOrderView } from '../contracts/sale-order.view';
import { CancelSaleOrderUseCase } from '../use-cases/cancel-sale-order.use-case';
import { ConfirmSaleOrderUseCase } from '../use-cases/confirm-sale-order.use-case';
import { CreateSaleOrderUseCase } from '../use-cases/create-sale-order.use-case';
import {
  DeleteSaleOrderResult,
  DeleteSaleOrderUseCase,
} from '../use-cases/delete-sale-order.use-case';
import { GetSaleOrdersCursorQueryUseCase } from '../use-cases/get-sale-orders-cursor.query.use-case';
import { GetSaleOrderQueryUseCase } from '../use-cases/get-sale-order.query.use-case';
import { GetSaleOrdersListQueryUseCase } from '../use-cases/get-sale-orders-list.query.use-case';
import { GetSaleOrdersPageQueryUseCase } from '../use-cases/get-sale-orders-page.query.use-case';
import { ResetSaleOrderDispatchStatusUseCase } from '../use-cases/reset-sale-order-dispatch-status.use-case';
import { UpdateSaleOrderUseCase } from '../use-cases/update-sale-order.use-case';

@Injectable()
export class SaleOrdersService {
  constructor(
    private readonly create_sale_order_use_case: CreateSaleOrderUseCase,
    private readonly update_sale_order_use_case: UpdateSaleOrderUseCase,
    private readonly confirm_sale_order_use_case: ConfirmSaleOrderUseCase,
    private readonly cancel_sale_order_use_case: CancelSaleOrderUseCase,
    private readonly delete_sale_order_use_case: DeleteSaleOrderUseCase,
    private readonly get_sale_orders_list_query_use_case: GetSaleOrdersListQueryUseCase,
    private readonly get_sale_orders_page_query_use_case: GetSaleOrdersPageQueryUseCase,
    private readonly get_sale_orders_cursor_query_use_case: GetSaleOrdersCursorQueryUseCase,
    private readonly get_sale_order_query_use_case: GetSaleOrderQueryUseCase,
    private readonly reset_sale_order_dispatch_status_use_case: ResetSaleOrderDispatchStatusUseCase,
  ) {}

  async get_sale_orders(
    current_user: AuthenticatedUserContext,
  ): Promise<SaleOrderView[]> {
    return this.get_sale_orders_list_query_use_case.execute({ current_user });
  }

  async get_sale_orders_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    return this.get_sale_orders_page_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_sale_orders_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<SaleOrderView>> {
    return this.get_sale_orders_cursor_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
  ) {
    return this.get_sale_order_query_use_case.execute({ current_user, order_id });
  }

  async create_sale_order(
    current_user: AuthenticatedUserContext,
    dto: CreateSaleOrderDto,
  ) {
    return this.create_sale_order_use_case.execute({ current_user, dto });
  }

  async update_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
    dto: UpdateSaleOrderDto,
  ) {
    return this.update_sale_order_use_case.execute({
      current_user,
      order_id,
      dto,
    });
  }

  async confirm_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
    idempotency_key?: string | null,
  ) {
    return this.confirm_sale_order_use_case.execute({
      current_user,
      order_id,
      idempotency_key,
    });
  }

  async cancel_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
    dto: CancelSaleOrderDto,
  ) {
    return this.cancel_sale_order_use_case.execute({
      current_user,
      order_id,
      dto,
    });
  }

  async delete_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
  ): Promise<DeleteSaleOrderResult> {
    return this.delete_sale_order_use_case.execute({ current_user, order_id });
  }

  async reset_dispatch_status(
    current_user: AuthenticatedUserContext,
    order_id: number,
    dto?: { delivery_requested_date?: string },
  ): Promise<SaleOrderView> {
    return this.reset_sale_order_dispatch_status_use_case.execute({
      current_user,
      order_id,
      delivery_requested_date: dto?.delivery_requested_date,
    });
  }
}
