import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { InventoryMovementHeader } from '../entities/inventory-movement-header.entity';

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
          product_variant: {
            product: true,
          },
          warehouse: true,
        },
      },
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
}
