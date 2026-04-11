import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchStop } from '../../inventory/entities/dispatch-stop.entity';
import { InventoryReservationsRepository } from '../../inventory/repositories/inventory-reservations.repository';
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
    private readonly inventory_reservations_repository: InventoryReservationsRepository,
    @InjectRepository(DispatchStop)
    private readonly dispatch_stop_repository: Repository<DispatchStop>,
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

    const reservations =
      await this.inventory_reservations_repository.find_by_sale_order_id(
        business_id,
        order.id,
      );

    const dispatch_stops = await this.dispatch_stop_repository.find({
      where: { sale_order_id: order.id },
      relations: ['dispatch_order'],
    });
    const seen_do_ids = new Set<number>();
    const dispatch_orders = dispatch_stops
      .filter((stop) => {
        if (!stop.dispatch_order || seen_do_ids.has(stop.dispatch_order.id))
          return false;
        seen_do_ids.add(stop.dispatch_order.id);
        return true;
      })
      .map((stop) => stop.dispatch_order!);

    return this.sale_order_serializer.serialize(
      order,
      reservations,
      dispatch_orders,
    );
  }
}
