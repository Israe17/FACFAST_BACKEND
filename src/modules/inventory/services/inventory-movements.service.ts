import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { InventoryMovementsRepository } from '../repositories/inventory-movements.repository';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class InventoryMovementsService {
  constructor(
    private readonly inventory_movements_repository: InventoryMovementsRepository,
    private readonly inventory_adjustments_service: InventoryAdjustmentsService,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async get_movements(current_user: AuthenticatedUserContext) {
    const movements =
      await this.inventory_movements_repository.find_all_by_business(
        current_user.business_id,
        this.inventory_validation_service.resolve_accessible_branch_ids(
          current_user,
        ),
      );
    return movements.map((movement) => this.serialize_movement(movement));
  }

  async adjust_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryAdjustmentDto,
  ) {
    return this.serialize_movement(
      await this.inventory_adjustments_service.adjust_inventory(
        current_user,
        dto,
      ),
    );
  }

  private serialize_movement(movement: InventoryMovement) {
    return {
      id: movement.id,
      code: movement.code,
      business_id: movement.business_id,
      branch_id: movement.branch_id,
      warehouse: movement.warehouse
        ? {
            id: movement.warehouse.id,
            code: movement.warehouse.code,
            name: movement.warehouse.name,
          }
        : {
            id: movement.warehouse_id,
          },
      location: movement.location
        ? {
            id: movement.location.id,
            code: movement.location.code,
            name: movement.location.name,
          }
        : null,
      product: movement.product
        ? {
            id: movement.product.id,
            code: movement.product.code,
            name: movement.product.name,
          }
        : {
            id: movement.product_id,
          },
      inventory_lot: movement.inventory_lot
        ? {
            id: movement.inventory_lot.id,
            code: movement.inventory_lot.code,
            lot_number: movement.inventory_lot.lot_number,
          }
        : null,
      movement_type: movement.movement_type,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      quantity: movement.quantity,
      previous_quantity: movement.previous_quantity,
      new_quantity: movement.new_quantity,
      notes: movement.notes,
      created_by: movement.created_by_user
        ? {
            id: movement.created_by_user.id,
            code: movement.created_by_user.code,
            name: movement.created_by_user.name,
            email: movement.created_by_user.email,
          }
        : {
            id: movement.created_by,
          },
      created_at: movement.created_at,
    };
  }
}
