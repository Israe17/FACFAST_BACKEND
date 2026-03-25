import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

export type GetSaleOrderQuery = {
  current_user: AuthenticatedUserContext;
  order_id: number;
};

@Injectable()
export class GetSaleOrderQueryUseCase
  implements QueryUseCase<GetSaleOrderQuery, SaleOrderView>
{
  constructor(
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    order_id,
  }: GetSaleOrderQuery): Promise<SaleOrderView> {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.sale_orders_repository.find_by_id_in_business(
      order_id,
      business_id,
    );
    if (!order) {
      throw new DomainNotFoundException({
        code: 'SALE_ORDER_NOT_FOUND',
        messageKey: 'sales.order_not_found',
        details: { order_id },
      });
    }

    this.sale_order_access_policy.assert_can_access_order(current_user, order);
    return this.sale_order_serializer.serialize(order);
  }
}
