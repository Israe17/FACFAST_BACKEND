import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { CreateDispatchExpenseDto } from '../dto/create-dispatch-expense.dto';
import { DispatchExpense } from '../entities/dispatch-expense.entity';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';

export type AddDispatchExpenseCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  dto: CreateDispatchExpenseDto;
  idempotency_key?: string | null;
};

@Injectable()
export class AddDispatchExpenseUseCase
  implements CommandUseCase<AddDispatchExpenseCommand, DispatchOrderView>
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
    dto,
    idempotency_key,
  }: AddDispatchExpenseCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);
    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.expenses.add.${dispatch_order_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          dispatch_order_id,
          expense_type: dto.expense_type,
          description: this.normalize_optional_string(dto.description),
          amount: dto.amount,
          receipt_number: this.normalize_optional_string(dto.receipt_number),
          notes: this.normalize_optional_string(dto.notes),
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

        await manager.getRepository(DispatchExpense).save(
          this.dispatch_expense_repository.create({
            business_id,
            dispatch_order_id,
            expense_type: dto.expense_type,
            description: this.normalize_optional_string(dto.description),
            amount: dto.amount,
            receipt_number: this.normalize_optional_string(dto.receipt_number),
            notes: this.normalize_optional_string(dto.notes),
            created_by_user_id: current_user.id,
          }),
        );

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

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
