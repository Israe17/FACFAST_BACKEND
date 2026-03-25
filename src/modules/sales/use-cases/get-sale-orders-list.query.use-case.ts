import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

export type GetSaleOrdersListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetSaleOrdersListQueryUseCase
  implements QueryUseCase<GetSaleOrdersListQuery, SaleOrderView[]>
{
  constructor(
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
  }: GetSaleOrdersListQuery): Promise<SaleOrderView[]> {
    const orders = await this.sale_orders_repository.find_all_by_business_in_scope(
      resolve_effective_business_id(current_user),
      resolve_effective_branch_scope_ids(current_user),
    );

    return orders.map((order) => this.sale_order_serializer.serialize(order));
  }
}
