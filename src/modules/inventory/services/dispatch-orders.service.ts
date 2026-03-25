import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { CreateDispatchExpenseDto } from '../dto/create-dispatch-expense.dto';
import { CreateDispatchOrderDto } from '../dto/create-dispatch-order.dto';
import { CreateDispatchStopDto } from '../dto/create-dispatch-stop.dto';
import { UpdateDispatchOrderDto } from '../dto/update-dispatch-order.dto';
import { AddDispatchExpenseUseCase } from '../use-cases/add-dispatch-expense.use-case';
import { AddDispatchStopUseCase } from '../use-cases/add-dispatch-stop.use-case';
import { CancelDispatchOrderUseCase } from '../use-cases/cancel-dispatch-order.use-case';
import { CreateDispatchOrderUseCase } from '../use-cases/create-dispatch-order.use-case';
import { GetDispatchOrderQueryUseCase } from '../use-cases/get-dispatch-order.query.use-case';
import { GetDispatchOrdersCursorQueryUseCase } from '../use-cases/get-dispatch-orders-cursor.query.use-case';
import { GetDispatchOrdersListQueryUseCase } from '../use-cases/get-dispatch-orders-list.query.use-case';
import { MarkDispatchOrderReadyUseCase } from '../use-cases/mark-dispatch-order-ready.use-case';
import { MarkDispatchOrderCompletedUseCase } from '../use-cases/mark-dispatch-order-completed.use-case';
import { MarkDispatchOrderDispatchedUseCase } from '../use-cases/mark-dispatch-order-dispatched.use-case';
import { RemoveDispatchExpenseUseCase } from '../use-cases/remove-dispatch-expense.use-case';
import { RemoveDispatchStopUseCase } from '../use-cases/remove-dispatch-stop.use-case';
import { UpdateDispatchOrderUseCase } from '../use-cases/update-dispatch-order.use-case';
import { UpdateDispatchStopStatusUseCase } from '../use-cases/update-dispatch-stop-status.use-case';
import { UpdateDispatchStopStatusDto } from '../dto/update-dispatch-stop-status.dto';

@Injectable()
export class DispatchOrdersService {
  constructor(
    private readonly get_dispatch_orders_list_query_use_case: GetDispatchOrdersListQueryUseCase,
    private readonly get_dispatch_orders_cursor_query_use_case: GetDispatchOrdersCursorQueryUseCase,
    private readonly get_dispatch_order_query_use_case: GetDispatchOrderQueryUseCase,
    private readonly create_dispatch_order_use_case: CreateDispatchOrderUseCase,
    private readonly update_dispatch_order_use_case: UpdateDispatchOrderUseCase,
    private readonly add_dispatch_stop_use_case: AddDispatchStopUseCase,
    private readonly remove_dispatch_stop_use_case: RemoveDispatchStopUseCase,
    private readonly add_dispatch_expense_use_case: AddDispatchExpenseUseCase,
    private readonly remove_dispatch_expense_use_case: RemoveDispatchExpenseUseCase,
    private readonly mark_dispatch_order_ready_use_case: MarkDispatchOrderReadyUseCase,
    private readonly mark_dispatch_order_dispatched_use_case: MarkDispatchOrderDispatchedUseCase,
    private readonly mark_dispatch_order_completed_use_case: MarkDispatchOrderCompletedUseCase,
    private readonly cancel_dispatch_order_use_case: CancelDispatchOrderUseCase,
    private readonly update_dispatch_stop_status_use_case: UpdateDispatchStopStatusUseCase,
  ) {}

  async get_dispatch_orders(
    current_user: AuthenticatedUserContext,
  ): Promise<DispatchOrderView[]> {
    return this.get_dispatch_orders_list_query_use_case.execute({ current_user });
  }

  async get_dispatch_orders_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<DispatchOrderView>> {
    return this.get_dispatch_orders_cursor_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_dispatch_order(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
  ): Promise<DispatchOrderView> {
    return this.get_dispatch_order_query_use_case.execute({
      current_user,
      dispatch_order_id,
    });
  }

  async create_dispatch_order(
    current_user: AuthenticatedUserContext,
    dto: CreateDispatchOrderDto,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.create_dispatch_order_use_case.execute({
      current_user,
      dto,
      idempotency_key,
    });
  }

  async update_dispatch_order(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    dto: UpdateDispatchOrderDto,
  ): Promise<DispatchOrderView> {
    return this.update_dispatch_order_use_case.execute({
      current_user,
      dispatch_order_id,
      dto,
    });
  }

  async add_stop(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    dto: CreateDispatchStopDto,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.add_dispatch_stop_use_case.execute({
      current_user,
      dispatch_order_id,
      dto,
      idempotency_key,
    });
  }

  async remove_stop(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    dispatch_stop_id: number,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.remove_dispatch_stop_use_case.execute({
      current_user,
      dispatch_order_id,
      dispatch_stop_id,
      idempotency_key,
    });
  }

  async update_stop_status(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    dispatch_stop_id: number,
    dto: UpdateDispatchStopStatusDto,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.update_dispatch_stop_status_use_case.execute({
      current_user,
      dispatch_order_id,
      dispatch_stop_id,
      dto,
      idempotency_key,
    });
  }

  async add_expense(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    dto: CreateDispatchExpenseDto,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.add_dispatch_expense_use_case.execute({
      current_user,
      dispatch_order_id,
      dto,
      idempotency_key,
    });
  }

  async remove_expense(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    dispatch_expense_id: number,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.remove_dispatch_expense_use_case.execute({
      current_user,
      dispatch_order_id,
      dispatch_expense_id,
      idempotency_key,
    });
  }

  async mark_ready(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.mark_dispatch_order_ready_use_case.execute({
      current_user,
      dispatch_order_id,
      idempotency_key,
    });
  }

  async mark_dispatched(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.mark_dispatch_order_dispatched_use_case.execute({
      current_user,
      dispatch_order_id,
      idempotency_key,
    });
  }

  async mark_completed(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.mark_dispatch_order_completed_use_case.execute({
      current_user,
      dispatch_order_id,
      idempotency_key,
    });
  }

  async cancel_dispatch(
    current_user: AuthenticatedUserContext,
    dispatch_order_id: number,
    idempotency_key?: string | null,
  ): Promise<DispatchOrderView> {
    return this.cancel_dispatch_order_use_case.execute({
      current_user,
      dispatch_order_id,
      idempotency_key,
    });
  }
}
