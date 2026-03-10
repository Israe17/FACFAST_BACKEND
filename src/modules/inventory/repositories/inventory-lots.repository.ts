import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { InventoryLot } from '../entities/inventory-lot.entity';

const lot_relations = {
  warehouse: true,
  location: true,
  product: true,
  supplier_contact: true,
} as const;

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
  ): Promise<boolean> {
    const query = this.inventory_lot_repository
      .createQueryBuilder('inventory_lot')
      .where('inventory_lot.warehouse_id = :warehouse_id', { warehouse_id })
      .andWhere('inventory_lot.product_id = :product_id', { product_id })
      .andWhere('LOWER(inventory_lot.lot_number) = LOWER(:lot_number)', {
        lot_number,
      });

    if (exclude_id !== undefined) {
      query.andWhere('inventory_lot.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
