import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { CreateDispatchStopDto } from '../dto/create-dispatch-stop.dto';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchType } from '../enums/dispatch-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from '../policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';
import { DispatchStopLine } from '../entities/dispatch-stop-line.entity';
import { create_dispatch_stop_lines } from '../helpers/create-dispatch-stop-lines.helper';

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
          relations: ['lines'],
        });
        if (!sale_order) {
          throw new DomainNotFoundException({
            code: 'SALE_ORDER_NOT_FOUND',
            messageKey: 'inventory.sale_order_not_found',
            details: { sale_order_id: dto.sale_order_id },
          });
        }

        await this.assert_sale_order_not_assigned_to_active_dispatch(
          manager,
          business_id,
          sale_order.id,
        );

        this.dispatch_sale_order_policy.assert_dispatchable_sale_order(
          order.branch_id,
          sale_order,
          order.origin_warehouse_id,
        );
        this.dispatch_sale_order_policy.assert_date_coherence(
          order.scheduled_date,
          sale_order,
        );

        const existing_stop_count = order.stops?.length ?? 0;
        this.assert_dispatch_type_allows_another_stop(
          order.dispatch_type,
          existing_stop_count,
        );
        const stop = await manager.getRepository(DispatchStop).save(
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
            delivery_latitude: sale_order.delivery_latitude ?? null,
            delivery_longitude: sale_order.delivery_longitude ?? null,
            notes: this.normalize_optional_string(dto.notes),
          }),
        );

        // Create stop lines from sale order lines (adjusting for previous deliveries)
        await create_dispatch_stop_lines(manager, {
          business_id,
          dispatch_stop_id: stop.id,
          sale_order_lines: sale_order.lines ?? [],
        });

        sale_order.dispatch_status = SaleDispatchStatus.ASSIGNED;
        await manager.getRepository(SaleOrder).save(sale_order);

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

  private assert_dispatch_type_allows_another_stop(
    dispatch_type: DispatchType,
    existing_stop_count: number,
  ): void {
    if (
      dispatch_type === DispatchType.INDIVIDUAL &&
      existing_stop_count >= 1
    ) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_INDIVIDUAL_REQUIRES_SINGLE_SALE_ORDER',
        messageKey:
          'inventory.dispatch_order_individual_requires_single_sale_order',
        details: {
          dispatch_type,
          existing_stop_count,
        },
      });
    }
  }

  private async assert_sale_order_not_assigned_to_active_dispatch(
    manager: EntityManager,
    business_id: number,
    sale_order_id: number,
  ): Promise<void> {
    const existing_stop = await manager
      .getRepository(DispatchStop)
      .createQueryBuilder('dispatch_stop')
      .innerJoinAndSelect('dispatch_stop.dispatch_order', 'dispatch_order')
      .where('dispatch_stop.business_id = :business_id', { business_id })
      .andWhere('dispatch_stop.sale_order_id = :sale_order_id', {
        sale_order_id,
      })
      .andWhere('dispatch_order.status NOT IN (:...blocked_statuses)', {
        blocked_statuses: [
          DispatchOrderStatus.CANCELLED,
          DispatchOrderStatus.COMPLETED,
        ],
      })
      .getOne();

    if (!existing_stop) {
      return;
    }

    throw new DomainConflictException({
      code: 'SALE_ORDER_ALREADY_ASSIGNED_TO_ACTIVE_DISPATCH',
      messageKey: 'inventory.sale_order_already_assigned_to_active_dispatch',
      details: {
        sale_order_id,
        dispatch_order_id: existing_stop.dispatch_order_id,
      },
    });
  }
}
