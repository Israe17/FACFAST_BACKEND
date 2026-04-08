import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderLifecyclePolicy } from '../policies/sale-order-lifecycle.policy';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';
import { DispatchStop } from '../../inventory/entities/dispatch-stop.entity';
import { DispatchOrderStatus } from '../../inventory/enums/dispatch-order-status.enum';

export type ResetSaleOrderDispatchStatusCommand = {
  current_user: AuthenticatedUserContext;
  order_id: number;
  delivery_requested_date?: string;
};

@Injectable()
export class ResetSaleOrderDispatchStatusUseCase
  implements
    CommandUseCase<ResetSaleOrderDispatchStatusCommand, SaleOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_lifecycle_policy: SaleOrderLifecyclePolicy,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    order_id,
    delivery_requested_date,
  }: ResetSaleOrderDispatchStatusCommand): Promise<SaleOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.data_source.transaction(async (manager) => {
      const order =
        await this.sale_orders_repository.find_by_id_in_business_for_update(
          manager,
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

      this.sale_order_access_policy.assert_can_access_order(
        current_user,
        order,
      );
      this.sale_order_lifecycle_policy.assert_dispatch_resettable(order);

      // Ensure no active dispatch stops exist for this order
      const active_stop = await manager
        .getRepository(DispatchStop)
        .createQueryBuilder('stop')
        .innerJoin('stop.dispatch_order', 'dispatch_order')
        .where('stop.sale_order_id = :order_id', { order_id })
        .andWhere('stop.business_id = :business_id', { business_id })
        .andWhere('dispatch_order.status NOT IN (:...terminal)', {
          terminal: [
            DispatchOrderStatus.CANCELLED,
            DispatchOrderStatus.COMPLETED,
          ],
        })
        .getOne();

      if (active_stop) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_HAS_ACTIVE_DISPATCH_STOPS',
          messageKey: 'sales.order_has_active_dispatch_stops',
          details: {
            order_id,
            dispatch_order_id: active_stop.dispatch_order_id,
          },
        });
      }

      order.dispatch_status = SaleDispatchStatus.PENDING;
      if (delivery_requested_date !== undefined) {
        order.delivery_requested_date = delivery_requested_date || null;
      }
      await manager.getRepository(SaleOrder).save(order);

      const full_order =
        await this.sale_orders_repository.find_by_id_in_business(
          order_id,
          business_id,
          manager,
        );
      return this.sale_order_serializer.serialize(full_order!);
    });
  }
}
