import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchExpense } from '../entities/dispatch-expense.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';
import { get_dispatch_status_for_fulfillment_mode } from '../../sales/utils/sale-dispatch-status.util';

export type DeleteDispatchOrderCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
};

export type DeleteDispatchOrderResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeleteDispatchOrderUseCase
  implements CommandUseCase<DeleteDispatchOrderCommand, DeleteDispatchOrderResult>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
  }: DeleteDispatchOrderCommand): Promise<DeleteDispatchOrderResult> {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.dispatch_orders_repository.find_by_id_in_business(
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
    this.dispatch_order_lifecycle_policy.assert_deletable(order);

    return this.data_source.transaction(async (manager) => {
      // Revert sale orders dispatch_status for any remaining stops
      for (const stop of order.stops ?? []) {
        const sale_order = await manager.getRepository(SaleOrder).findOne({
          where: { id: stop.sale_order_id, business_id },
        });
        if (sale_order) {
          sale_order.dispatch_status =
            get_dispatch_status_for_fulfillment_mode(
              sale_order.fulfillment_mode,
            );
          await manager.getRepository(SaleOrder).save(sale_order);
        }
      }

      // Delete child collections
      await manager
        .getRepository(DispatchExpense)
        .delete({ dispatch_order_id: order.id });
      await manager
        .getRepository(DispatchStop)
        .delete({ dispatch_order_id: order.id });

      // Delete the dispatch order
      await this.dispatch_orders_repository.remove(order, manager);

      return { id: dispatch_order_id, deleted: true };
    });
  }
}
