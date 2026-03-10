import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { InventoryMovement } from '../entities/inventory-movement.entity';

const movement_relations = {
  warehouse: true,
  location: true,
  product: true,
  inventory_lot: true,
  created_by_user: true,
} as const;

@Injectable()
export class InventoryMovementsRepository {
  constructor(
    @InjectRepository(InventoryMovement)
    private readonly inventory_movement_repository: Repository<InventoryMovement>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<InventoryMovement>): InventoryMovement {
    return this.inventory_movement_repository.create(payload);
  }

  async save(
    inventory_movement: InventoryMovement,
  ): Promise<InventoryMovement> {
    const saved_inventory_movement =
      await this.inventory_movement_repository.save(inventory_movement);
    return this.entity_code_service.ensure_code(
      this.inventory_movement_repository,
      saved_inventory_movement,
      'IM',
    );
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<InventoryMovement[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.inventory_movement_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: movement_relations,
      order: {
        created_at: 'DESC',
        id: 'DESC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<InventoryMovement | null> {
    return this.inventory_movement_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: movement_relations,
    });
  }
}
