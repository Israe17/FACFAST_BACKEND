import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import {
  apply_cursor,
  apply_pagination,
  apply_search,
  apply_sorting,
} from '../../common/utils/query-builder.util';
import { InventoryMovementHeader } from '../entities/inventory-movement-header.entity';

const MOVEMENT_SEARCH_COLUMNS = [
  'header.code',
  'header.notes',
  'header.source_document_number',
];

const MOVEMENT_SORT_COLUMNS: Record<string, string> = {
  occurred_at: 'header.occurred_at',
  code: 'header.code',
  movement_type: 'header.movement_type',
  status: 'header.status',
  created_at: 'header.created_at',
};

@Injectable()
export class InventoryMovementHeadersRepository {
  constructor(
    @InjectRepository(InventoryMovementHeader)
    private readonly inventory_movement_header_repository: Repository<InventoryMovementHeader>,
  ) {}

  create(payload: Partial<InventoryMovementHeader>): InventoryMovementHeader {
    return this.inventory_movement_header_repository.create(payload);
  }

  async save(
    inventory_movement_header: InventoryMovementHeader,
  ): Promise<InventoryMovementHeader> {
    return this.inventory_movement_header_repository.save(
      inventory_movement_header,
    );
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<InventoryMovementHeader | null> {
    return this.inventory_movement_header_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: {
        branch: true,
        performed_by_user: true,
        lines: {
          location: true,
          inventory_lot: true,
          product_variant: {
            product: true,
          },
          warehouse: true,
        },
      },
    });
  }

  async find_by_id_in_business_for_update(
    manager: EntityManager,
    id: number,
    business_id: number,
  ): Promise<InventoryMovementHeader | null> {
    return manager
      .getRepository(InventoryMovementHeader)
      .createQueryBuilder('header')
      .setLock('pessimistic_write', undefined, ['header'])
      .leftJoinAndSelect('header.branch', 'branch')
      .leftJoinAndSelect('header.performed_by_user', 'performed_by_user')
      .leftJoinAndSelect('header.lines', 'line')
      .leftJoinAndSelect('line.location', 'location')
      .leftJoinAndSelect('line.inventory_lot', 'inventory_lot')
      .leftJoinAndSelect('line.product_variant', 'product_variant')
      .leftJoinAndSelect('product_variant.product', 'product')
      .leftJoinAndSelect('line.warehouse', 'warehouse')
      .where('header.id = :id', { id })
      .andWhere('header.business_id = :business_id', { business_id })
      .orderBy('line.line_no', 'ASC')
      .getOne();
  }

  async find_by_source_document(
    business_id: number,
    source_document_type: string,
    source_document_id: number,
  ): Promise<InventoryMovementHeader[]> {
    return this.inventory_movement_header_repository.find({
      where: { business_id, source_document_type, source_document_id },
      order: { occurred_at: 'DESC', id: 'DESC' },
    });
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<InventoryMovementHeader[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.inventory_movement_header_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: {
        branch: true,
        performed_by_user: true,
        lines: {
          location: true,
          inventory_lot: true,
          product_variant: {
            product: true,
          },
          warehouse: true,
        },
      },
      order: {
        occurred_at: 'DESC',
        id: 'DESC',
        lines: {
          line_no: 'ASC',
        },
      },
    });
  }

  async find_paginated_by_business<R>(
    business_id: number,
    branch_ids: number[] | undefined,
    query: PaginatedQueryDto,
    mapper: (header: InventoryMovementHeader) => R,
  ): Promise<PaginatedResponseDto<R>> {
    if (branch_ids && branch_ids.length === 0) {
      return new PaginatedResponseDto(
        [],
        0,
        query.page ?? 1,
        query.limit ?? 20,
      );
    }

    const qb = this.inventory_movement_header_repository
      .createQueryBuilder('header')
      .leftJoinAndSelect('header.branch', 'branch')
      .leftJoinAndSelect('header.performed_by_user', 'performed_by_user')
      .leftJoinAndSelect('header.lines', 'lines')
      .leftJoinAndSelect('lines.location', 'location')
      .leftJoinAndSelect('lines.inventory_lot', 'inventory_lot')
      .leftJoinAndSelect('lines.product_variant', 'product_variant')
      .leftJoinAndSelect('product_variant.product', 'product')
      .leftJoinAndSelect('lines.warehouse', 'warehouse')
      .where('header.business_id = :business_id', { business_id })
      .distinct(true);

    if (branch_ids?.length) {
      qb.andWhere('header.branch_id IN (:...branch_ids)', { branch_ids });
    }

    apply_search(qb, query.search, MOVEMENT_SEARCH_COLUMNS);
    apply_sorting(
      qb,
      query.sort_by,
      query.sort_order,
      MOVEMENT_SORT_COLUMNS,
      'header.occurred_at',
      'DESC',
    );

    return apply_pagination(qb, query, mapper);
  }

  async find_cursor_by_business<R>(
    business_id: number,
    branch_ids: number[] | undefined,
    query: CursorQueryDto,
    mapper: (header: InventoryMovementHeader) => R,
  ): Promise<CursorResponseDto<R>> {
    if (branch_ids && branch_ids.length === 0) {
      return new CursorResponseDto([], null, false);
    }

    const qb = this.inventory_movement_header_repository
      .createQueryBuilder('header')
      .leftJoinAndSelect('header.branch', 'branch')
      .leftJoinAndSelect('header.performed_by_user', 'performed_by_user')
      .leftJoinAndSelect('header.lines', 'lines')
      .leftJoinAndSelect('lines.location', 'location')
      .leftJoinAndSelect('lines.inventory_lot', 'inventory_lot')
      .leftJoinAndSelect('lines.product_variant', 'product_variant')
      .leftJoinAndSelect('product_variant.product', 'product')
      .leftJoinAndSelect('lines.warehouse', 'warehouse')
      .where('header.business_id = :business_id', { business_id })
      .distinct(true);

    if (branch_ids?.length) {
      qb.andWhere('header.branch_id IN (:...branch_ids)', { branch_ids });
    }

    apply_search(qb, query.search, MOVEMENT_SEARCH_COLUMNS);
    qb.orderBy('header.id', query.sort_order ?? 'DESC');

    return apply_cursor(qb, query, 'header.id', mapper);
  }
}
