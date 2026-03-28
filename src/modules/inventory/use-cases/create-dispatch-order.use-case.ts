import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateDispatchOrderDto } from '../dto/create-dispatch-order.dto';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchType } from '../enums/dispatch-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchSaleOrderPolicy } from '../policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { DispatchCatalogValidationService } from '../services/dispatch-catalog-validation.service';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';

export type CreateDispatchOrderCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateDispatchOrderDto;
  idempotency_key?: string | null;
};

@Injectable()
export class CreateDispatchOrderUseCase
  implements CommandUseCase<CreateDispatchOrderCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_sale_order_policy: DispatchSaleOrderPolicy,
    private readonly dispatch_catalog_validation_service: DispatchCatalogValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
    private readonly idempotency_service: IdempotencyService,
    @InjectRepository(DispatchStop)
    private readonly dispatch_stop_repository: Repository<DispatchStop>,
  ) {}

  async execute({
    current_user,
    dto,
    idempotency_key,
  }: CreateDispatchOrderCommand): Promise<DispatchOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    this.dispatch_order_access_policy.assert_can_access_branch_id(
      current_user,
      dto.branch_id,
    );
    if (dto.code) {
      this.entity_code_service.validate_code('DO', dto.code);
    }
    if (dto.route_id !== undefined && dto.route_id !== null) {
      await this.dispatch_catalog_validation_service.get_route_for_branch_operation(
        current_user,
        dto.route_id,
        dto.branch_id,
        { require_active: true },
      );
    }
    if (dto.vehicle_id !== undefined && dto.vehicle_id !== null) {
      await this.dispatch_catalog_validation_service.get_vehicle_for_branch_operation(
        current_user,
        dto.vehicle_id,
        dto.branch_id,
        { require_active: true },
      );
    }
    if (dto.driver_user_id !== undefined && dto.driver_user_id !== null) {
      await this.dispatch_catalog_validation_service.get_driver_user_for_dispatch_operation(
        current_user,
        dto.driver_user_id,
        dto.branch_id,
        { require_active: true },
      );
    }
    if (
      dto.origin_warehouse_id !== undefined &&
      dto.origin_warehouse_id !== null
    ) {
      await this.dispatch_catalog_validation_service.get_warehouse_for_branch_operation(
        current_user,
        dto.origin_warehouse_id,
        dto.branch_id,
        { require_active: true },
      );
    }

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: 'inventory.dispatch_orders.create',
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          branch_id: dto.branch_id,
          dispatch_type: dto.dispatch_type,
          code: dto.code?.trim() ?? null,
          route_id: dto.route_id ?? null,
          vehicle_id: dto.vehicle_id ?? null,
          driver_user_id: dto.driver_user_id ?? null,
          origin_warehouse_id: dto.origin_warehouse_id ?? null,
          scheduled_date: dto.scheduled_date ?? null,
          notes: this.normalize_optional_string(dto.notes),
          stop_sale_order_ids: dto.stop_sale_order_ids ?? [],
        },
      },
      async (manager) => {
        this.assert_dispatch_type_allows_stop_count(
          dto.dispatch_type,
          dto.stop_sale_order_ids?.length ?? 0,
        );

        const dispatch_order_repository = manager.getRepository(DispatchOrder);
        const order = await dispatch_order_repository.save(
          this.dispatch_orders_repository.create({
            business_id,
            branch_id: dto.branch_id,
            dispatch_type: dto.dispatch_type,
            code: dto.code?.trim() ?? null,
            route_id: dto.route_id ?? null,
            vehicle_id: dto.vehicle_id ?? null,
            driver_user_id: dto.driver_user_id ?? null,
            origin_warehouse_id: dto.origin_warehouse_id ?? null,
            scheduled_date: dto.scheduled_date ?? null,
            notes: this.normalize_optional_string(dto.notes),
            created_by_user_id: current_user.id,
          }),
        );
        await this.entity_code_service.ensure_code(
          dispatch_order_repository,
          order,
          'DO',
        );

        if (dto.stop_sale_order_ids?.length) {
          for (let index = 0; index < dto.stop_sale_order_ids.length; index++) {
            const sale_order_id = dto.stop_sale_order_ids[index];
            await this.assert_sale_order_not_assigned_to_active_dispatch(
              manager,
              business_id,
              sale_order_id,
            );

            const sale_order = await manager.getRepository(SaleOrder).findOne({
              where: { id: sale_order_id, business_id },
            });
            if (!sale_order) {
              throw new DomainNotFoundException({
                code: 'SALE_ORDER_NOT_FOUND',
                messageKey: 'inventory.sale_order_not_found',
                details: { sale_order_id },
              });
            }

            this.dispatch_sale_order_policy.assert_dispatchable_sale_order(
              order.branch_id,
              sale_order,
              order.origin_warehouse_id,
            );

            await manager.getRepository(DispatchStop).save(
              this.dispatch_stop_repository.create({
                business_id,
                dispatch_order_id: order.id,
                sale_order_id: sale_order.id,
                customer_contact_id: sale_order.customer_contact_id,
                delivery_sequence: index + 1,
                delivery_address: sale_order.delivery_address,
                delivery_province: sale_order.delivery_province,
                delivery_canton: sale_order.delivery_canton,
                delivery_district: sale_order.delivery_district,
              }),
            );

            sale_order.dispatch_status = SaleDispatchStatus.ASSIGNED;
            await manager.getRepository(SaleOrder).save(sale_order);
          }
        }

        const full_order =
          await this.dispatch_orders_repository.find_by_id_in_business(
            order.id,
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

  private assert_dispatch_type_allows_stop_count(
    dispatch_type: DispatchType,
    stop_count: number,
  ): void {
    if (dispatch_type === DispatchType.INDIVIDUAL && stop_count > 1) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_INDIVIDUAL_REQUIRES_SINGLE_SALE_ORDER',
        messageKey:
          'inventory.dispatch_order_individual_requires_single_sale_order',
        details: {
          dispatch_type,
          stop_count,
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
