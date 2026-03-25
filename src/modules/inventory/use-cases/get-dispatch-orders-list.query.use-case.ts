import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';

export type GetDispatchOrdersListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetDispatchOrdersListQueryUseCase
  implements QueryUseCase<GetDispatchOrdersListQuery, DispatchOrderView[]>
{
  constructor(
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
  ) {}

  async execute({
    current_user,
  }: GetDispatchOrdersListQuery): Promise<DispatchOrderView[]> {
    const orders =
      await this.dispatch_orders_repository.find_all_by_business_in_scope(
        resolve_effective_business_id(current_user),
        resolve_effective_branch_scope_ids(current_user),
      );

    return orders.map((order) => this.dispatch_order_serializer.serialize(order));
  }
}
