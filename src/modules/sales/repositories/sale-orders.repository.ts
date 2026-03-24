import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { EntityCodeService } from '../../common/services/entity-code.service';
import {
  apply_pagination,
  apply_search,
  apply_sorting,
} from '../../common/utils/query-builder.util';
import { SaleOrder } from '../entities/sale-order.entity';

const SALE_ORDER_SORT_COLUMNS: Record<string, string> = {
  code: 'sale_order.code',
  order_date: 'sale_order.order_date',
  status: 'sale_order.status',
  dispatch_status: 'sale_order.dispatch_status',
  fulfillment_mode: 'sale_order.fulfillment_mode',
  created_at: 'sale_order.created_at',
  updated_at: 'sale_order.updated_at',
};

const SALE_ORDER_SEARCH_COLUMNS = [
  'sale_order.code',
  'customer_contact.name',
  'seller.name',
  'branch.name',
];

const SALE_ORDER_LIST_RELATIONS = [
  'customer_contact',
  'seller',
  'branch',
  'delivery_zone',
  'warehouse',
  'created_by_user',
];

const SALE_ORDER_DETAIL_RELATIONS = [
  ...SALE_ORDER_LIST_RELATIONS,
  'lines',
  'lines.product_variant',
  'lines.product_variant.product',
  'delivery_charges',
];

@Injectable()
export class SaleOrdersRepository {
  constructor(
    @InjectRepository(SaleOrder)
    private readonly sale_order_repository: Repository<SaleOrder>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<SaleOrder>): SaleOrder {
    return this.sale_order_repository.create(payload);
  }

  async save(order: SaleOrder): Promise<SaleOrder> {
    const saved_order = await this.sale_order_repository.save(order);
    return this.entity_code_service.ensure_code(
      this.sale_order_repository,
      saved_order,
      'SO',
    );
  }

  async find_all_by_business(business_id: number): Promise<SaleOrder[]> {
    return this.sale_order_repository.find({
      where: { business_id },
      relations: SALE_ORDER_LIST_RELATIONS,
      order: { order_date: 'DESC' },
    });
  }

  async find_paginated_by_business(
    business_id: number,
    query: PaginatedQueryDto,
    mapper: (order: SaleOrder) => unknown,
  ): Promise<PaginatedResponseDto<unknown>> {
    const qb = this.sale_order_repository
      .createQueryBuilder('sale_order')
      .leftJoinAndSelect('sale_order.customer_contact', 'customer_contact')
      .leftJoinAndSelect('sale_order.seller', 'seller')
      .leftJoinAndSelect('sale_order.branch', 'branch')
      .leftJoinAndSelect('sale_order.delivery_zone', 'delivery_zone')
      .leftJoinAndSelect('sale_order.warehouse', 'warehouse')
      .leftJoinAndSelect('sale_order.created_by_user', 'created_by_user')
      .where('sale_order.business_id = :business_id', { business_id });

    apply_search(qb, query.search, SALE_ORDER_SEARCH_COLUMNS);
    apply_sorting(
      qb,
      query.sort_by,
      query.sort_order,
      SALE_ORDER_SORT_COLUMNS,
      'sale_order.order_date',
      'DESC',
    );

    return apply_pagination(qb, query, mapper);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<SaleOrder | null> {
    return this.sale_order_repository.findOne({
      where: { id, business_id },
      relations: SALE_ORDER_DETAIL_RELATIONS,
    });
  }

  async exists_code(
    business_id: number,
    code: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const qb = this.sale_order_repository
      .createQueryBuilder('sale_order')
      .where('sale_order.business_id = :business_id', { business_id })
      .andWhere('sale_order.code = :code', { code });

    if (exclude_id !== undefined) {
      qb.andWhere('sale_order.id != :exclude_id', { exclude_id });
    }

    return (await qb.getCount()) > 0;
  }

  async remove(order: SaleOrder): Promise<void> {
    await this.sale_order_repository.remove(order);
  }
}
