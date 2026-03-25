import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { CreateDispatchStopDto } from '../dto/create-dispatch-stop.dto';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from '../policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { SaleOrder } from '../../sales/entities/sale-order.entity';

export type AddDispatchStopCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  dto: CreateDispatchStopDto;
  idempotency_key?: string | null;
};

@Injectable()
export class AddDispatchStopUseCase
  implements CommandUseCase<AddDispatchStopCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_sale_order_policy: DispatchSaleOrderPolicy,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
    @InjectRepository(DispatchStop)
    private readonly dispatch_stop_repository: Repository<DispatchStop>,
    @InjectRepository(SaleOrder)
    private readonly sale_order_repository: Repository<SaleOrder>,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    dto,
    idempotency_key,
  }: AddDispatchStopCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);
    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.dispatch_orders.stops.add.${dispatch_order_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          dispatch_order_id,
          sale_order_id: dto.sale_order_id,
          delivery_sequence: dto.delivery_sequence ?? null,
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

        const sale_order = await manager.getRepository(SaleOrder).findOne({
          where: { id: dto.sale_order_id, business_id },
        });
        if (!sale_order) {
          throw new DomainNotFoundException({
            code: 'SALE_ORDER_NOT_FOUND',
            messageKey: 'inventory.sale_order_not_found',
            details: { sale_order_id: dto.sale_order_id },
          });
        }
        this.dispatch_sale_order_policy.assert_dispatchable_sale_order(
          order.branch_id,
          sale_order,
        );

        const existing_stop_count = order.stops?.length ?? 0;
        await manager.getRepository(DispatchStop).save(
          this.dispatch_stop_repository.create({
            business_id,
            dispatch_order_id: order.id,
            sale_order_id: sale_order.id,
            customer_contact_id: sale_order.customer_contact_id,
            delivery_sequence: dto.delivery_sequence ?? existing_stop_count + 1,
            delivery_address: sale_order.delivery_address,
            delivery_province: sale_order.delivery_province,
            delivery_canton: sale_order.delivery_canton,
            delivery_district: sale_order.delivery_district,
            notes: this.normalize_optional_string(dto.notes),
          }),
        );

        const full_order =
          await this.dispatch_orders_repository.find_by_id_in_business(
            dispatch_order_id,
            business_id,
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
