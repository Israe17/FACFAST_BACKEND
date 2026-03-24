import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateDispatchOrderDto } from '../dto/create-dispatch-order.dto';
import { UpdateDispatchOrderDto } from '../dto/update-dispatch-order.dto';
import { CreateDispatchStopDto } from '../dto/create-dispatch-stop.dto';
import { CreateDispatchExpenseDto } from '../dto/create-dispatch-expense.dto';
import { DispatchOrder } from '../entities/dispatch-order.entity';
import { DispatchStop } from '../entities/dispatch-stop.entity';
import { DispatchExpense } from '../entities/dispatch-expense.entity';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { InventoryLedgerService } from './inventory-ledger.service';
import { SaleOrder } from '../../sales/entities/sale-order.entity';

@Injectable()
export class DispatchOrdersService {
  constructor(
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly data_source: DataSource,
    @InjectRepository(DispatchStop)
    private readonly dispatch_stop_repository: Repository<DispatchStop>,
    @InjectRepository(DispatchExpense)
    private readonly dispatch_expense_repository: Repository<DispatchExpense>,
    @InjectRepository(SaleOrder)
    private readonly sale_order_repository: Repository<SaleOrder>,
  ) {}

  async get_dispatch_orders(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const orders =
      await this.dispatch_orders_repository.find_all_by_business(business_id);
    return orders.map((order) => this.serialize_dispatch_order(order));
  }

  async get_dispatch_order(
    current_user: AuthenticatedUserContext,
    id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, id);
    return this.serialize_dispatch_order(order);
  }

  async create_dispatch_order(
    current_user: AuthenticatedUserContext,
    dto: CreateDispatchOrderDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);

    if (dto.code) {
      this.entity_code_service.validate_code('DO', dto.code);
    }

    const order = await this.dispatch_orders_repository.save(
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

    if (dto.stop_sale_order_ids && dto.stop_sale_order_ids.length > 0) {
      for (let i = 0; i < dto.stop_sale_order_ids.length; i++) {
        const sale_order_id = dto.stop_sale_order_ids[i];
        const sale_order = await this.sale_order_repository.findOne({
          where: { id: sale_order_id, business_id },
        });
        if (sale_order) {
          await this.dispatch_stop_repository.save(
            this.dispatch_stop_repository.create({
              business_id,
              dispatch_order_id: order.id,
              sale_order_id: sale_order.id,
              customer_contact_id: sale_order.customer_contact_id,
              delivery_sequence: i + 1,
              delivery_address: sale_order.delivery_address,
              delivery_province: sale_order.delivery_province,
              delivery_canton: sale_order.delivery_canton,
              delivery_district: sale_order.delivery_district,
            }),
          );
        }
      }
    }

    return this.get_dispatch_order(current_user, order.id);
  }

  async update_dispatch_order(
    current_user: AuthenticatedUserContext,
    id: number,
    dto: UpdateDispatchOrderDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, id);

    if (
      order.status !== DispatchOrderStatus.DRAFT &&
      order.status !== DispatchOrderStatus.READY
    ) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_NOT_EDITABLE',
        messageKey: 'inventory.dispatch_order_not_editable',
        details: { status: order.status },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('DO', dto.code.trim());
      order.code = dto.code.trim();
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

    await this.dispatch_orders_repository.save(order);
    return this.get_dispatch_order(current_user, id);
  }

  async add_stop(
    current_user: AuthenticatedUserContext,
    dispatch_id: number,
    dto: CreateDispatchStopDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, dispatch_id);

    const sale_order = await this.sale_order_repository.findOne({
      where: { id: dto.sale_order_id, business_id },
    });
    if (!sale_order) {
      throw new DomainNotFoundException({
        code: 'SALE_ORDER_NOT_FOUND',
        messageKey: 'inventory.sale_order_not_found',
        details: { sale_order_id: dto.sale_order_id },
      });
    }

    const existing_stop_count = order.stops?.length ?? 0;

    await this.dispatch_stop_repository.save(
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

    return this.get_dispatch_order(current_user, dispatch_id);
  }

  async remove_stop(
    current_user: AuthenticatedUserContext,
    dispatch_id: number,
    stop_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_order_entity(business_id, dispatch_id);

    const stop = await this.dispatch_stop_repository.findOne({
      where: { id: stop_id, dispatch_order_id: dispatch_id, business_id },
    });
    if (!stop) {
      throw new DomainNotFoundException({
        code: 'DISPATCH_STOP_NOT_FOUND',
        messageKey: 'inventory.dispatch_stop_not_found',
        details: { stop_id },
      });
    }

    await this.dispatch_stop_repository.remove(stop);
    return this.get_dispatch_order(current_user, dispatch_id);
  }

  async add_expense(
    current_user: AuthenticatedUserContext,
    dispatch_id: number,
    dto: CreateDispatchExpenseDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_order_entity(business_id, dispatch_id);

    await this.dispatch_expense_repository.save(
      this.dispatch_expense_repository.create({
        business_id,
        dispatch_order_id: dispatch_id,
        expense_type: dto.expense_type,
        description: this.normalize_optional_string(dto.description),
        amount: dto.amount,
        receipt_number: this.normalize_optional_string(dto.receipt_number),
        notes: this.normalize_optional_string(dto.notes),
        created_by_user_id: current_user.id,
      }),
    );

    return this.get_dispatch_order(current_user, dispatch_id);
  }

  async remove_expense(
    current_user: AuthenticatedUserContext,
    dispatch_id: number,
    expense_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_order_entity(business_id, dispatch_id);

    const expense = await this.dispatch_expense_repository.findOne({
      where: { id: expense_id, dispatch_order_id: dispatch_id, business_id },
    });
    if (!expense) {
      throw new DomainNotFoundException({
        code: 'DISPATCH_EXPENSE_NOT_FOUND',
        messageKey: 'inventory.dispatch_expense_not_found',
        details: { expense_id },
      });
    }

    await this.dispatch_expense_repository.remove(expense);
    return this.get_dispatch_order(current_user, dispatch_id);
  }

  async mark_dispatched(
    current_user: AuthenticatedUserContext,
    id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, id);

    if (order.status !== DispatchOrderStatus.READY) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_NOT_READY',
        messageKey: 'inventory.dispatch_order_not_ready',
        details: { status: order.status },
      });
    }

    await this.data_source.transaction(async (manager) => {
      order.status = DispatchOrderStatus.DISPATCHED;
      order.dispatched_at = new Date();
      await manager.getRepository(DispatchOrder).save(order);

      for (const stop of order.stops ?? []) {
        const sale_order = await this.sale_order_repository.findOne({
          where: { id: stop.sale_order_id, business_id },
          relations: ['lines', 'lines.product_variant', 'warehouse'],
        });

        if (!sale_order || !sale_order.warehouse) continue;

        const trackable_lines = (sale_order.lines ?? []).filter(
          (line) => line.product_variant?.track_inventory !== false,
        );

        if (trackable_lines.length > 0) {
          await this.inventory_ledger_service.post_posted_movement(
            manager,
            {
              business_id,
              branch_id: sale_order.branch_id,
              performed_by_user_id: current_user.id,
              occurred_at: new Date(),
              movement_type: InventoryMovementHeaderType.SALES_DISPATCH,
              source_document_type: 'DispatchOrder',
              source_document_id: order.id,
              source_document_number: order.code,
              notes: `Despacho de stock para orden de venta ${sale_order.code}`,
            },
            trackable_lines.map((line) => ({
              warehouse: sale_order.warehouse!,
              product_variant: line.product_variant!,
              quantity: Number(line.quantity),
              on_hand_delta: -Number(line.quantity),
              reserved_delta: -Number(line.quantity),
            })),
          );
        }
      }
    });

    return this.get_dispatch_order(current_user, id);
  }

  async mark_completed(
    current_user: AuthenticatedUserContext,
    id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, id);

    if (
      order.status !== DispatchOrderStatus.DISPATCHED &&
      order.status !== DispatchOrderStatus.IN_TRANSIT
    ) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_NOT_IN_PROGRESS',
        messageKey: 'inventory.dispatch_order_not_in_progress',
        details: { status: order.status },
      });
    }

    order.status = DispatchOrderStatus.COMPLETED;
    order.completed_at = new Date();
    await this.dispatch_orders_repository.save(order);
    return this.get_dispatch_order(current_user, id);
  }

  async cancel_dispatch(
    current_user: AuthenticatedUserContext,
    id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, id);

    if (
      order.status === DispatchOrderStatus.CANCELLED ||
      order.status === DispatchOrderStatus.COMPLETED
    ) {
      throw new DomainConflictException({
        code: 'DISPATCH_ORDER_CANNOT_CANCEL',
        messageKey: 'inventory.dispatch_order_cannot_cancel',
        details: { status: order.status },
      });
    }

    order.status = DispatchOrderStatus.CANCELLED;
    await this.dispatch_orders_repository.save(order);
    return this.get_dispatch_order(current_user, id);
  }

  private async get_order_entity(
    business_id: number,
    id: number,
  ): Promise<DispatchOrder> {
    const order = await this.dispatch_orders_repository.find_by_id_in_business(
      id,
      business_id,
    );
    if (!order) {
      throw new DomainNotFoundException({
        code: 'DISPATCH_ORDER_NOT_FOUND',
        messageKey: 'inventory.dispatch_order_not_found',
        details: { dispatch_order_id: id },
      });
    }
    return order;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_dispatch_order(order: DispatchOrder) {
    const can_edit =
      order.status === DispatchOrderStatus.DRAFT ||
      order.status === DispatchOrderStatus.READY;
    const can_dispatch = order.status === DispatchOrderStatus.READY;
    const can_complete =
      order.status === DispatchOrderStatus.DISPATCHED ||
      order.status === DispatchOrderStatus.IN_TRANSIT;
    const can_cancel =
      order.status !== DispatchOrderStatus.CANCELLED &&
      order.status !== DispatchOrderStatus.COMPLETED;

    return {
      id: order.id,
      code: order.code,
      business_id: order.business_id,
      branch_id: order.branch_id,
      branch: order.branch ?? null,
      dispatch_type: order.dispatch_type,
      status: order.status,
      route_id: order.route_id,
      route: order.route ?? null,
      vehicle_id: order.vehicle_id,
      vehicle: order.vehicle ?? null,
      driver_user_id: order.driver_user_id,
      driver_user: order.driver_user ?? null,
      origin_warehouse_id: order.origin_warehouse_id,
      scheduled_date: order.scheduled_date,
      dispatched_at: order.dispatched_at,
      completed_at: order.completed_at,
      notes: order.notes,
      created_by_user_id: order.created_by_user_id,
      stops: order.stops ?? [],
      expenses: order.expenses ?? [],
      lifecycle: {
        can_edit,
        can_dispatch,
        can_complete,
        can_cancel,
      },
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
