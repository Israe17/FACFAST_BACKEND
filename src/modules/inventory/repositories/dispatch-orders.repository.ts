import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { apply_cursor, apply_search } from '../../common/utils/query-builder.util';
import { DispatchOrder } from '../entities/dispatch-order.entity';

const DISPATCH_ORDER_LIST_RELATIONS = [
  'route',
  'vehicle',
  'driver_user',
  'branch',
  'origin_warehouse',
  'created_by_user',
];

const DISPATCH_ORDER_DETAIL_RELATIONS = [
  ...DISPATCH_ORDER_LIST_RELATIONS,
  'stops',
  'stops.sale_order',
  'stops.customer_contact',
  'expenses',
  'expenses.created_by_user',
];

const DISPATCH_ORDER_SEARCH_COLUMNS = [
  'dispatch_order.code',
  'dispatch_order.notes',
  'route.name',
  'vehicle.name',
  'vehicle.plate_number',
];

@Injectable()
export class DispatchOrdersRepository {
  constructor(
    @InjectRepository(DispatchOrder)
    private readonly dispatch_order_repository: Repository<DispatchOrder>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<DispatchOrder>): DispatchOrder {
    return this.dispatch_order_repository.create(payload);
  }

  async save(dispatch_order: DispatchOrder): Promise<DispatchOrder> {
    const saved = await this.dispatch_order_repository.save(dispatch_order);
    return this.entity_code_service.ensure_code(
      this.dispatch_order_repository,
      saved,
      'DO',
    );
  }

  async find_all_by_business(business_id: number): Promise<DispatchOrder[]> {
    return this.find_all_by_business_in_scope(business_id);
  }

  async find_all_by_business_in_scope(
    business_id: number,
    branch_ids?: number[],
  ): Promise<DispatchOrder[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.dispatch_order_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: DISPATCH_ORDER_LIST_RELATIONS,
      order: { scheduled_date: 'DESC' },
    });
  }

  async find_cursor_by_business_in_scope<T>(
    business_id: number,
    branch_ids: number[] | undefined,
    query: CursorQueryDto,
    mapper: (dispatch_order: DispatchOrder) => T,
  ): Promise<CursorResponseDto<T>> {
    if (branch_ids && branch_ids.length === 0) {
      return new CursorResponseDto([], null, false);
    }

    const qb = this.dispatch_order_repository
      .createQueryBuilder('dispatch_order')
      .leftJoinAndSelect('dispatch_order.route', 'route')
      .leftJoinAndSelect('dispatch_order.vehicle', 'vehicle')
      .leftJoinAndSelect('dispatch_order.driver_user', 'driver_user')
      .leftJoinAndSelect('dispatch_order.branch', 'branch')
      .leftJoinAndSelect('dispatch_order.origin_warehouse', 'origin_warehouse')
      .leftJoinAndSelect('dispatch_order.created_by_user', 'created_by_user')
      .where('dispatch_order.business_id = :business_id', { business_id });

    if (branch_ids?.length) {
      qb.andWhere('dispatch_order.branch_id IN (:...branch_ids)', { branch_ids });
    }

    apply_search(qb, query.search, DISPATCH_ORDER_SEARCH_COLUMNS);
    qb.orderBy('dispatch_order.id', query.sort_order ?? 'DESC');

    return apply_cursor(qb, query, 'dispatch_order.id', mapper);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
    manager?: EntityManager,
  ): Promise<DispatchOrder | null> {
    const repo = manager
      ? manager.getRepository(DispatchOrder)
      : this.dispatch_order_repository;
    return repo.findOne({
      where: { id, business_id },
      relations: DISPATCH_ORDER_DETAIL_RELATIONS,
    });
  }

  async find_by_id_in_business_for_update(
    manager: EntityManager,
    id: number,
    business_id: number,
  ): Promise<DispatchOrder | null> {
    return manager
      .getRepository(DispatchOrder)
      .createQueryBuilder('dispatch_order')
      .setLock('pessimistic_write', undefined, ['dispatch_order'])
      .leftJoinAndSelect('dispatch_order.route', 'route')
      .leftJoinAndSelect('dispatch_order.vehicle', 'vehicle')
      .leftJoinAndSelect('dispatch_order.driver_user', 'driver_user')
      .leftJoinAndSelect('dispatch_order.branch', 'branch')
      .leftJoinAndSelect('dispatch_order.origin_warehouse', 'origin_warehouse')
      .leftJoinAndSelect('dispatch_order.created_by_user', 'created_by_user')
      .leftJoinAndSelect('dispatch_order.stops', 'stop')
      .leftJoinAndSelect('stop.sale_order', 'stop_sale_order')
      .leftJoinAndSelect('stop.customer_contact', 'stop_customer_contact')
      .leftJoinAndSelect('dispatch_order.expenses', 'expense')
      .leftJoinAndSelect('expense.created_by_user', 'expense_created_by_user')
      .where('dispatch_order.id = :id', { id })
      .andWhere('dispatch_order.business_id = :business_id', { business_id })
      .orderBy('stop.delivery_sequence', 'ASC')
      .addOrderBy('expense.id', 'ASC')
      .getOne();
  }

  async remove(
    order: DispatchOrder,
    manager?: EntityManager,
  ): Promise<void> {
    const repository = manager
      ? manager.getRepository(DispatchOrder)
      : this.dispatch_order_repository;
    await repository.remove(order);
  }
}
