import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { UpdateDispatchOrderDto } from '../dto/update-dispatch-order.dto';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchType } from '../enums/dispatch-type.enum';
import { DispatchOrderAccessPolicy } from '../policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from '../policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from '../policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';
import { DispatchCatalogValidationService } from '../services/dispatch-catalog-validation.service';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleDispatchStatus } from '../../sales/enums/sale-dispatch-status.enum';
import { DispatchStopLine } from '../entities/dispatch-stop-line.entity';

export type UpdateDispatchOrderCommand = {
  current_user: AuthenticatedUserContext;
  dispatch_order_id: number;
  dto: UpdateDispatchOrderDto;
};

@Injectable()
export class UpdateDispatchOrderUseCase
  implements CommandUseCase<UpdateDispatchOrderCommand, DispatchOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_access_policy: DispatchOrderAccessPolicy,
    private readonly dispatch_order_lifecycle_policy: DispatchOrderLifecyclePolicy,
    private readonly dispatch_sale_order_policy: DispatchSaleOrderPolicy,
    private readonly dispatch_catalog_validation_service: DispatchCatalogValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
  ) {}

  async execute({
    current_user,
    dispatch_order_id,
    dto,
  }: UpdateDispatchOrderCommand): Promise<DispatchOrderView> {
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
    this.dispatch_order_lifecycle_policy.assert_editable(order);

    if (dto.branch_id !== undefined) {
      this.dispatch_order_access_policy.assert_can_access_branch_id(
        current_user,
        dto.branch_id,
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('DO', dto.code.trim());
    }

    const effective_branch_id = dto.branch_id ?? order.branch_id;
    const effective_route_id =
      dto.route_id !== undefined ? dto.route_id : order.route_id;
    const effective_vehicle_id =
      dto.vehicle_id !== undefined ? dto.vehicle_id : order.vehicle_id;
    const effective_driver_user_id =
      dto.driver_user_id !== undefined ? dto.driver_user_id : order.driver_user_id;
    const effective_origin_warehouse_id =
      dto.origin_warehouse_id !== undefined
        ? dto.origin_warehouse_id
        : order.origin_warehouse_id;
    const effective_dispatch_type =
      dto.dispatch_type !== undefined ? dto.dispatch_type : order.dispatch_type;

    if (effective_route_id !== null && effective_route_id !== undefined) {
      await this.dispatch_catalog_validation_service.get_route_for_branch_operation(
        current_user,
        effective_route_id,
        effective_branch_id,
        { require_active: true },
      );
    }

    if (effective_vehicle_id !== null && effective_vehicle_id !== undefined) {
      await this.dispatch_catalog_validation_service.get_vehicle_for_branch_operation(
        current_user,
        effective_vehicle_id,
        effective_branch_id,
        { require_active: true },
      );
    }
    if (
      effective_driver_user_id !== null &&
      effective_driver_user_id !== undefined
    ) {
      await this.dispatch_catalog_validation_service.get_driver_user_for_dispatch_operation(
        current_user,
        effective_driver_user_id,
        effective_branch_id,
        { require_active: true },
      );
    }
    if (
      effective_origin_warehouse_id !== null &&
      effective_origin_warehouse_id !== undefined
    ) {
      await this.dispatch_catalog_validation_service.get_warehouse_for_branch_operation(
        current_user,
        effective_origin_warehouse_id,
        effective_branch_id,
        { require_active: true },
      );
    }

    return this.data_source.transaction(async (manager) => {
      const dispatch_order_repository = manager.getRepository(DispatchOrder);

      if (dto.code !== undefined) {
        order.code = dto.code?.trim() ?? null;
      }
      if (dto.branch_id !== undefined) {
        order.branch_id = dto.branch_id;
      }
      if (dto.dispatch_type !== undefined) {
        order.dispatch_type = dto.dispatch_type;
      }
      if (dto.route_id !== undefined) {
        order.route_id = dto.route_id ?? null;
      }
      if (dto.vehicle_id !== undefined) {
        order.vehicle_id = dto.vehicle_id ?? null;
      }
      if (dto.driver_user_id !== undefined) {
        order.driver_user_id = dto.driver_user_id ?? null;
      }
      if (dto.origin_warehouse_id !== undefined) {
        order.origin_warehouse_id = dto.origin_warehouse_id ?? null;
      }
      if (dto.scheduled_date !== undefined) {
        order.scheduled_date = dto.scheduled_date ?? null;
      }
      if (dto.notes !== undefined) {
        order.notes = this.normalize_optional_string(dto.notes);
      }

      await dispatch_order_repository.save(order);

      // Replace stops if stop_sale_order_ids was sent in the payload
      if (dto.stop_sale_order_ids !== undefined) {
        await this.replace_stops(
          manager,
          order,
          business_id,
          effective_branch_id,
          effective_origin_warehouse_id,
          effective_dispatch_type,
          dto.stop_sale_order_ids ?? [],
        );
      }

      const full_order = await this.dispatch_orders_repository.find_by_id_in_business(
        order.id,
        business_id,
        manager,
      );
      return this.dispatch_order_serializer.serialize(full_order!);
    });
  }

  private async replace_stops(
    manager: EntityManager,
    order: DispatchOrder,
    business_id: number,
    effective_branch_id: number,
    effective_origin_warehouse_id: number | null | undefined,
    effective_dispatch_type: DispatchType,
    new_sale_order_ids: number[],
  ): Promise<void> {
    this.assert_dispatch_type_allows_stop_count(
      effective_dispatch_type,
      new_sale_order_ids.length,
    );

    const dispatch_stop_repository = manager.getRepository(DispatchStop);
    const sale_order_repository = manager.getRepository(SaleOrder);

    // Release dispatch status on old stops being removed
    const current_stops = order.stops ?? [];
    const new_ids_set = new Set(new_sale_order_ids);
    for (const stop of current_stops) {
      if (!new_ids_set.has(stop.sale_order_id)) {
        const sale_order = await sale_order_repository.findOne({
          where: { id: stop.sale_order_id, business_id },
        });
        if (sale_order && sale_order.dispatch_status === SaleDispatchStatus.ASSIGNED) {
          sale_order.dispatch_status = SaleDispatchStatus.PENDING;
          await sale_order_repository.save(sale_order);
        }
      }
    }

    // Delete all current stops
    await dispatch_stop_repository.delete({ dispatch_order_id: order.id });

    // Create new stops
    for (let index = 0; index < new_sale_order_ids.length; index++) {
      const sale_order_id = new_sale_order_ids[index];

      // Verify sale order not assigned to another active dispatch
      const existing_stop = await dispatch_stop_repository
        .createQueryBuilder('stop')
        .innerJoin('stop.dispatch_order', 'dispatch_order')
        .where('stop.sale_order_id = :sale_order_id', { sale_order_id })
        .andWhere('dispatch_order.business_id = :business_id', { business_id })
        .andWhere('dispatch_order.id != :current_id', { current_id: order.id })
        .andWhere('dispatch_order.status NOT IN (:...excluded)', {
          excluded: ['cancelled', 'completed'],
        })
        .getOne();

      if (existing_stop) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_ALREADY_ASSIGNED_TO_DISPATCH',
          messageKey: 'inventory.sale_order_already_assigned_to_dispatch',
          details: { sale_order_id, dispatch_order_id: existing_stop.dispatch_order_id },
        });
      }

      const sale_order = await sale_order_repository.findOne({
        where: { id: sale_order_id, business_id },
        relations: ['lines'],
      });
      if (!sale_order) {
        throw new DomainNotFoundException({
          code: 'SALE_ORDER_NOT_FOUND',
          messageKey: 'inventory.sale_order_not_found',
          details: { sale_order_id },
        });
      }

      this.dispatch_sale_order_policy.assert_dispatch_order_sale_order(
        effective_branch_id,
        sale_order,
        effective_origin_warehouse_id,
      );
      this.dispatch_sale_order_policy.assert_date_coherence(
        order.scheduled_date,
        sale_order,
      );

      const stop = await dispatch_stop_repository.save(
        dispatch_stop_repository.create({
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

      // Create stop lines from sale order lines
      const stop_line_repo = manager.getRepository(DispatchStopLine);
      for (const line of sale_order.lines ?? []) {
        await stop_line_repo.save(
          stop_line_repo.create({
            business_id,
            dispatch_stop_id: stop.id,
            sale_order_line_id: line.id,
            product_variant_id: line.product_variant_id,
            ordered_quantity: line.quantity,
          }),
        );
      }

      sale_order.dispatch_status = SaleDispatchStatus.ASSIGNED;
      await sale_order_repository.save(sale_order);
    }
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
      throw new DomainBadRequestException({
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
}
