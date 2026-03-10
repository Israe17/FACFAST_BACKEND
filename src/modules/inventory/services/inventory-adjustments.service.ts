import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryMovementsRepository } from '../repositories/inventory-movements.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class InventoryAdjustmentsService {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_movements_repository: InventoryMovementsRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async adjust_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryAdjustmentDto,
  ): Promise<InventoryMovement> {
    if (
      dto.movement_type !== InventoryMovementType.ADJUSTMENT_IN &&
      dto.movement_type !== InventoryMovementType.ADJUSTMENT_OUT
    ) {
      throw new BadRequestException(
        'This endpoint only supports adjustment_in and adjustment_out movements.',
      );
    }

    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.warehouse_id,
      );
    const product =
      await this.inventory_validation_service.get_product_in_business(
        current_user.business_id,
        dto.product_id,
      );
    this.inventory_validation_service.assert_product_is_inventory_enabled(
      product,
    );

    const location =
      dto.location_id !== undefined && dto.location_id !== null
        ? await this.inventory_validation_service.get_location_for_operation(
            current_user,
            dto.location_id,
          )
        : null;
    if (location) {
      this.inventory_validation_service.assert_location_belongs_to_warehouse(
        location,
        warehouse.id,
      );
    }

    const inventory_lot =
      dto.inventory_lot_id !== undefined && dto.inventory_lot_id !== null
        ? await this.inventory_validation_service.get_inventory_lot_for_operation(
            current_user,
            dto.inventory_lot_id,
          )
        : null;

    if (inventory_lot) {
      if (inventory_lot.warehouse_id !== warehouse.id) {
        throw new BadRequestException(
          'The selected inventory lot does not belong to the warehouse.',
        );
      }
      if (inventory_lot.product_id !== product.id) {
        throw new BadRequestException(
          'The selected inventory lot does not belong to the product.',
        );
      }
      if (
        location &&
        inventory_lot.location_id &&
        inventory_lot.location_id !== location.id
      ) {
        throw new BadRequestException(
          'The selected inventory lot does not belong to the warehouse location.',
        );
      }
    }

    if (product.track_lots && !inventory_lot) {
      throw new BadRequestException(
        'This product requires an inventory lot for stock adjustments.',
      );
    }

    if (!product.track_lots && inventory_lot) {
      throw new BadRequestException(
        'This product does not support lot-based inventory.',
      );
    }

    let movement_id: number | null = null;
    await this.data_source.transaction(async (manager) => {
      const warehouse_stock_repository = manager.getRepository(WarehouseStock);
      const inventory_lot_repository = manager.getRepository(InventoryLot);
      const inventory_movement_repository =
        manager.getRepository(InventoryMovement);

      let warehouse_stock = await warehouse_stock_repository.findOne({
        where: {
          warehouse_id: warehouse.id,
          product_id: product.id,
        },
      });

      if (!warehouse_stock) {
        warehouse_stock = warehouse_stock_repository.create({
          business_id: current_user.business_id,
          branch_id: warehouse.branch_id,
          warehouse_id: warehouse.id,
          product_id: product.id,
          quantity: 0,
          reserved_quantity: 0,
          min_stock: null,
          max_stock: null,
        });
      }

      const previous_quantity = Number(warehouse_stock.quantity ?? 0);
      const delta =
        dto.movement_type === InventoryMovementType.ADJUSTMENT_IN
          ? Number(dto.quantity)
          : -Number(dto.quantity);
      const new_quantity = previous_quantity + delta;

      if (new_quantity < 0 && !product.allow_negative_stock) {
        throw new BadRequestException(
          'This adjustment would produce negative stock and the product does not allow it.',
        );
      }

      let persisted_lot: InventoryLot | null = null;
      if (inventory_lot) {
        persisted_lot = await inventory_lot_repository.findOne({
          where: {
            id: inventory_lot.id,
          },
        });

        if (!persisted_lot) {
          throw new NotFoundException('Inventory lot not found.');
        }

        const lot_previous_quantity = Number(
          persisted_lot.current_quantity ?? 0,
        );
        const lot_new_quantity = lot_previous_quantity + delta;
        if (lot_new_quantity < 0) {
          throw new BadRequestException(
            'This adjustment would produce a negative lot balance.',
          );
        }

        persisted_lot.current_quantity = lot_new_quantity;
        await inventory_lot_repository.save(persisted_lot);
      }

      warehouse_stock.quantity = new_quantity;
      await warehouse_stock_repository.save(warehouse_stock);

      let movement = inventory_movement_repository.create({
        business_id: current_user.business_id,
        branch_id: warehouse.branch_id,
        warehouse_id: warehouse.id,
        location_id: location?.id ?? persisted_lot?.location_id ?? null,
        product_id: product.id,
        inventory_lot_id: persisted_lot?.id ?? null,
        movement_type: dto.movement_type,
        reference_type: this.normalize_optional_string(dto.reference_type),
        reference_id: dto.reference_id ?? null,
        quantity: Number(dto.quantity),
        previous_quantity,
        new_quantity,
        notes: this.normalize_optional_string(dto.notes),
        created_by: current_user.id,
      });

      movement = await inventory_movement_repository.save(movement);
      movement = await this.entity_code_service.ensure_code(
        inventory_movement_repository,
        movement,
        'IM',
      );
      movement_id = movement.id;
    });

    const movement = movement_id
      ? await this.inventory_movements_repository.find_by_id_in_business(
          movement_id,
          current_user.business_id,
        )
      : null;
    if (!movement) {
      throw new NotFoundException('Inventory movement not found.');
    }

    return movement;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
