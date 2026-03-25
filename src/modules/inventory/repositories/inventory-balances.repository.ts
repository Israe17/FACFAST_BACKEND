import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { apply_cursor, apply_search } from '../../common/utils/query-builder.util';
import { InventoryBalance } from '../entities/inventory-balance.entity';

const INVENTORY_BALANCE_SEARCH_COLUMNS = [
  'warehouse.name',
  'warehouse.code',
  'product.name',
  'product.code',
  'product_variant.sku',
  'product_variant.barcode',
  'product_variant.variant_name',
];

@Injectable()
export class InventoryBalancesRepository {
  constructor(
    @InjectRepository(InventoryBalance)
    private readonly inventory_balance_repository: Repository<InventoryBalance>,
  ) {}

  create(payload: Partial<InventoryBalance>): InventoryBalance {
    return this.inventory_balance_repository.create(payload);
  }

  async save(inventory_balance: InventoryBalance): Promise<InventoryBalance> {
    return this.inventory_balance_repository.save(inventory_balance);
  }

  async find_by_warehouse_and_variant(
    business_id: number,
    warehouse_id: number,
    product_variant_id: number,
  ): Promise<InventoryBalance | null> {
    return this.inventory_balance_repository.findOne({
      where: {
        business_id,
        warehouse_id,
        product_variant_id,
      },
    });
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<InventoryBalance[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    const query = this.build_scoped_query(business_id, branch_ids);

    return query
      .orderBy('inventory_balance.warehouse_id', 'ASC')
      .addOrderBy('inventory_balance.product_variant_id', 'ASC')
      .distinct(true)
      .getMany();
  }

  async find_cursor_by_business<T>(
    business_id: number,
    branch_ids: number[] | undefined,
    query: CursorQueryDto,
    mapper: (balance: InventoryBalance) => T,
  ): Promise<CursorResponseDto<T>> {
    if (branch_ids && branch_ids.length === 0) {
      return new CursorResponseDto([], null, false);
    }

    const qb = this.build_scoped_query(business_id, branch_ids);
    apply_search(qb, query.search, INVENTORY_BALANCE_SEARCH_COLUMNS);
    qb.orderBy('inventory_balance.id', query.sort_order ?? 'DESC').distinct(true);

    return apply_cursor(qb, query, 'inventory_balance.id', mapper);
  }

  async find_all_by_warehouse(
    business_id: number,
    warehouse_id: number,
  ): Promise<InventoryBalance[]> {
    return this.build_warehouse_query(business_id, warehouse_id)
      .orderBy('inventory_balance.product_variant_id', 'ASC')
      .getMany();
  }

  async find_cursor_by_warehouse<T>(
    business_id: number,
    warehouse_id: number,
    query: CursorQueryDto,
    mapper: (balance: InventoryBalance) => T,
  ): Promise<CursorResponseDto<T>> {
    const qb = this.build_warehouse_query(business_id, warehouse_id);
    apply_search(qb, query.search, INVENTORY_BALANCE_SEARCH_COLUMNS);
    qb.orderBy('inventory_balance.id', query.sort_order ?? 'DESC');

    return apply_cursor(qb, query, 'inventory_balance.id', mapper);
  }

  async count_by_variant_in_business(
    business_id: number,
    product_variant_id: number,
  ): Promise<number> {
    return this.inventory_balance_repository.count({
      where: {
        business_id,
        product_variant_id,
      },
    });
  }

  async delete_all_by_business(business_id: number): Promise<void> {
    await this.inventory_balance_repository.delete({ business_id });
  }

  private build_scoped_query(
    business_id: number,
    branch_ids?: number[],
  ) {
    const query = this.inventory_balance_repository
      .createQueryBuilder('inventory_balance')
      .leftJoinAndSelect('inventory_balance.warehouse', 'warehouse')
      .leftJoinAndSelect(
        'warehouse.branch_links',
        'branch_link',
        'branch_link.is_active = true',
      )
      .leftJoinAndSelect('inventory_balance.product_variant', 'product_variant')
      .leftJoinAndSelect('product_variant.product', 'product')
      .where('inventory_balance.business_id = :business_id', { business_id });

    if (branch_ids?.length) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('warehouse.branch_id IN (:...branch_ids)', {
            branch_ids,
          }).orWhere('branch_link.branch_id IN (:...branch_ids)', {
            branch_ids,
          });
        }),
      );
    }

    return query;
  }

  private build_warehouse_query(
    business_id: number,
    warehouse_id: number,
  ) {
    return this.inventory_balance_repository
      .createQueryBuilder('inventory_balance')
      .leftJoinAndSelect('inventory_balance.warehouse', 'warehouse')
      .leftJoinAndSelect('inventory_balance.product_variant', 'product_variant')
      .leftJoinAndSelect('product_variant.product', 'product')
      .where('inventory_balance.business_id = :business_id', { business_id })
      .andWhere('inventory_balance.warehouse_id = :warehouse_id', {
        warehouse_id,
      });
  }
}
