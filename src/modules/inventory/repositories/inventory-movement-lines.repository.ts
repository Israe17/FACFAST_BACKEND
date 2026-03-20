import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InventoryMovementLine } from '../entities/inventory-movement-line.entity';

@Injectable()
export class InventoryMovementLinesRepository {
  constructor(
    @InjectRepository(InventoryMovementLine)
    private readonly inventory_movement_line_repository: Repository<InventoryMovementLine>,
  ) {}

  create(payload: Partial<InventoryMovementLine>): InventoryMovementLine {
    return this.inventory_movement_line_repository.create(payload);
  }

  async save(
    inventory_movement_line: InventoryMovementLine,
  ): Promise<InventoryMovementLine> {
    return this.inventory_movement_line_repository.save(
      inventory_movement_line,
    );
  }

  async find_all_by_business(
    business_id: number,
  ): Promise<InventoryMovementLine[]> {
    return this.inventory_movement_line_repository.find({
      where: {
        business_id,
      },
      relations: {
        header: true,
        location: true,
        inventory_lot: true,
        product_variant: true,
        warehouse: true,
      },
      order: {
        id: 'ASC',
      },
    });
  }

  async count_by_variant_in_business(
    business_id: number,
    product_variant_id: number,
  ): Promise<number> {
    return this.inventory_movement_line_repository.count({
      where: {
        business_id,
        product_variant_id,
      },
    });
  }
}
