import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchExpense } from '../entities/dispatch-expense.entity';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';

export type RemoveDispatchExpenseCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  dispatch_expense_id: number;
  idempotency_key?: string | null;
};

@Injectable()
export class RemoveDispatchExpenseUseCase
  implements CommandUseCase<RemoveDispatchExpenseCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
    @InjectRepository(DispatchExpense)
    private readonly dispatch_expense_repository: Repository<DispatchExpense>,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    dispatch_expense_id,
    idempotency_key,
  }: RemoveDispatchExpenseCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);
    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.expenses.remove.${dispatch_order_id}.${dispatch_expense_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          dispatch_order_id,
          dispatch_expense_id,
        },
      },
      async (manager) => {
        const order =
          await this.dispatch_orders_repository.find_by_id_in_business_for_update(
            manager,
            dispatch_order_id,
            business_id,
          );
        if (!order) {
          throw new DomainNotFoundException({
            code: 'DISPATCH_ORDER_NOT_FOUND',
            messageKey: 'inventory.dispatch_order_not_found',
            details: { dispatch_order_id },
          });
        }

        this.dispatch_order_access_policy.assert_can_access_order(
          current_user,
          order,
        );
        this.dispatch_order_lifecycle_policy.assert_editable(order);

        const expense = await manager.getRepository(DispatchExpense).findOne({
          where: {
            id: dispatch_expense_id,
            dispatch_order_id,
            business_id,
          },
        });
        if (!expense) {
          throw new DomainNotFoundException({
            code: 'DISPATCH_EXPENSE_NOT_FOUND',
            messageKey: 'inventory.dispatch_expense_not_found',
            details: { expense_id: dispatch_expense_id },
          });
        }

        await manager.getRepository(DispatchExpense).remove(expense);
        const full_order =
          await this.dispatch_orders_repository.find_by_id_in_business(
            dispatch_order_id,
            business_id,
            manager,
          );
        return this.dispatch_order_serializer.serialize(full_order!);
      },
    );
  }
}
