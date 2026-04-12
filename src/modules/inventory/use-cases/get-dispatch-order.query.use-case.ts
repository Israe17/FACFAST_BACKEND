import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { InventoryMovementHeadersRepository } from '../repositories/inventory-movement-headers.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';

export type GetDispatchOrderQuery = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
};

@Injectable()
export class GetDispatchOrderQueryUseCase
  implements QueryUseCase<GetDispatchOrderQuery, DispatchOrderView>
{
  constructor(
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly inventory_movement_headers_repository: InventoryMovementHeadersRepository,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
  }: GetDispatchOrderQuery): Promise<DispatchOrderView> {
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

    this.dispatch_order_access_policy.assert_can_access_order(current_user, order);

    const movements =
      await this.inventory_movement_headers_repository.find_by_source_document(
        business_id,
        'DispatchOrder',
        order.id,
      );

    return this.dispatch_order_serializer.serialize(order, movements);
  }
}
