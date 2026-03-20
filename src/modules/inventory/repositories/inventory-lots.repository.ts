import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { EntityCodeService } from '../../common/services/entity-code.service';
import {
  apply_pagination,
  apply_search,
  apply_sorting,
} from '../../common/utils/query-builder.util';
import { InventoryLot } from '../entities/inventory-lot.entity';

const lot_relations = {
  warehouse: true,
  location: true,
  product: true,
  product_variant: true,
  supplier_contact: true,
} as const;

const LOT_SORT_COLUMNS: Record<string, string> = {
  lot_number: 'lot.lot_number',
  code: 'lot.code',
  created_at: 'lot.created_at',
  expiration_date: 'lot.expiration_date',
  current_quantity: 'lot.current_quantity',
};

const LOT_SEARCH_COLUMNS = [
  'lot.lot_number',
  'lot.code',
  'product.name',
  'product.code',
  'warehouse.name',
];

@Injectable()
export class InventoryLotsRepository {
  constructor(
    @InjectRepository(InventoryLot)
    private readonly inventory_lot_repository: Repository<InventoryLot>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<InventoryLot>): InventoryLot {
    return this.inventory_lot_repository.create(payload);
  }

  async save(inventory_lot: InventoryLot): Promise<InventoryLot> {
    const saved_inventory_lot =
      await this.inventory_lot_repository.save(inventory_lot);
    return this.entity_code_service.ensure_code(
      this.inventory_lot_repository,
      saved_inventory_lot,
      'LT',
    );
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<InventoryLot[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.inventory_lot_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: lot_relations,
      order: {
        created_at: 'DESC',
      },
    });
  }

  async find_paginated_by_business(
    business_id: number,
    branch_ids: number[] | undefined,
    query: PaginatedQueryDto,
    mapper: (lot: InventoryLot) => unknown,
  ): Promise<PaginatedResponseDto<unknown>> {
    if (branch_ids && branch_ids.length === 0) {
      return new PaginatedResponseDto(
        [],
        0,
        query.page ?? 1,
        query.limit ?? 20,
      );
    }

    const qb = this.inventory_lot_repository
      .createQueryBuilder('lot')
      .leftJoinAndSelect('lot.warehouse', 'warehouse')
      .leftJoinAndSelect('lot.location', 'location')
      .leftJoinAndSelect('lot.product', 'product')
      .leftJoinAndSelect('lot.product_variant', 'product_variant')
      .leftJoinAndSelect('lot.supplier_contact', 'supplier_contact')
      .where('lot.business_id = :business_id', { business_id });

    if (branch_ids?.length) {
      qb.andWhere('lot.branch_id IN (:...branch_ids)', { branch_ids });
    }

    apply_search(qb, query.search, LOT_SEARCH_COLUMNS);
    apply_sorting(
      qb,
      query.sort_by,
      query.sort_order,
      LOT_SORT_COLUMNS,
      'lot.created_at',
      'DESC',
    );

    return apply_pagination(qb, query, mapper);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<InventoryLot | null> {
    return this.inventory_lot_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: lot_relations,
    });
  }

  async exists_lot_in_warehouse(
    warehouse_id: number,
    product_id: number,
    lot_number: string,
    exclude_id?: number,
    product_variant_id?: number | null,
  ): Promise<boolean> {
    const query = this.inventory_lot_repository
      .createQueryBuilder('inventory_lot')
      .where('inventory_lot.warehouse_id = :warehouse_id', { warehouse_id })
      .andWhere('inventory_lot.product_id = :product_id', { product_id })
      .andWhere('LOWER(inventory_lot.lot_number) = LOWER(:lot_number)', {
        lot_number,
      });

    if (product_variant_id !== undefined) {
      if (product_variant_id === null) {
        query.andWhere('inventory_lot.product_variant_id IS NULL');
      } else {
        query.andWhere(
          'inventory_lot.product_variant_id = :product_variant_id',
          { product_variant_id },
        );
      }
    }

    if (exclude_id !== undefined) {
      query.andWhere('inventory_lot.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }

  async count_by_variant_in_business(
    business_id: number,
    product_variant_id: number,
  ): Promise<number> {
    return this.inventory_lot_repository.count({
      where: {
        business_id,
        product_variant_id,
      },
    });
  }
}
