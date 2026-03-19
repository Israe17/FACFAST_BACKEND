import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryMovementsRepository } from '../repositories/inventory-movements.repository';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryValidationService } from './inventory-validation.service';
import { ProductVariantsService } from './product-variants.service';

@Injectable()
export class InventoryAdjustmentsService {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_movements_repository: InventoryMovementsRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
  ) {}

  async adjust_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryAdjustmentDto,
  ): Promise<InventoryMovement> {
    const business_id = resolve_effective_business_id(current_user);
    if (
      dto.movement_type !== InventoryMovementType.ADJUSTMENT_IN &&
      dto.movement_type !== InventoryMovementType.ADJUSTMENT_OUT
    ) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_ADJUSTMENT_TYPE_INVALID',
        messageKey: 'inventory.adjustment_type_invalid',
        details: {
          field: 'movement_type',
        },
      });
    }

    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.warehouse_id,
      );
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        dto.product_id,
      );
    const product_variant =
      await this.product_variants_service.resolve_variant_for_operation(
        business_id,
        product,
        dto.product_variant_id,
      );
    this.inventory_validation_service.assert_product_is_inventory_enabled(
      product,
    );
    const branch_id =
      await this.inventory_ledger_service.resolve_operational_branch_id(
        current_user,
        [warehouse],
      );
    await this.inventory_ledger_service.assert_warehouse_allowed_for_branch(
      business_id,
      warehouse,
      branch_id,
    );
    this.inventory_ledger_service.assert_tenant_consistency(
      business_id,
      warehouse.business_id,
      warehouse,
      product_variant,
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
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_WAREHOUSE_MISMATCH',
          messageKey: 'inventory.inventory_lot_warehouse_mismatch',
        });
      }
      if (inventory_lot.product_id !== product.id) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_PRODUCT_MISMATCH',
          messageKey: 'inventory.inventory_lot_product_mismatch',
        });
      }
      if (
        location &&
        inventory_lot.location_id &&
        inventory_lot.location_id !== location.id
      ) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_LOCATION_MISMATCH',
          messageKey: 'inventory.inventory_lot_location_mismatch',
        });
      }
    }

    if (product_variant.track_lots && !inventory_lot) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_LOT_REQUIRED',
        messageKey: 'inventory.inventory_lot_required',
      });
    }

    if (!product_variant.track_lots && inventory_lot) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_LOT_TRACKING_REQUIRED',
        messageKey: 'inventory.product_lot_tracking_required',
      });
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
          product_variant_id: product_variant.id,
        },
      });

      if (!warehouse_stock) {
        warehouse_stock = warehouse_stock_repository.create({
          business_id,
          branch_id,
          warehouse_id: warehouse.id,
          product_id: product.id,
          product_variant_id: product_variant.id,
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

      if (new_quantity < 0 && !product_variant.allow_negative_stock) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_NEGATIVE_STOCK_FORBIDDEN',
          messageKey: 'inventory.negative_stock_forbidden',
        });
      }

      let persisted_lot: InventoryLot | null = null;
      if (inventory_lot) {
        persisted_lot = await inventory_lot_repository.findOne({
          where: {
            id: inventory_lot.id,
          },
        });

        if (!persisted_lot) {
          throw new DomainNotFoundException({
            code: 'INVENTORY_LOT_NOT_FOUND',
            messageKey: 'inventory.inventory_lot_not_found',
            details: {
              inventory_lot_id: inventory_lot.id,
            },
          });
        }

        const lot_previous_quantity = Number(
          persisted_lot.current_quantity ?? 0,
        );
        const lot_new_quantity = lot_previous_quantity + delta;
        if (lot_new_quantity < 0) {
          throw new DomainBadRequestException({
            code: 'INVENTORY_LOT_NEGATIVE_BALANCE_FORBIDDEN',
            messageKey: 'inventory.inventory_lot_negative_balance_forbidden',
          });
        }

        persisted_lot.current_quantity = lot_new_quantity;
        await inventory_lot_repository.save(persisted_lot);
      }

      warehouse_stock.quantity = new_quantity;
      warehouse_stock.branch_id = branch_id;
      await warehouse_stock_repository.save(warehouse_stock);

      let movement = inventory_movement_repository.create({
        business_id,
        branch_id,
        warehouse_id: warehouse.id,
        location_id: location?.id ?? persisted_lot?.location_id ?? null,
        product_id: product.id,
        product_variant_id: product_variant.id,
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

      await this.inventory_ledger_service.post_posted_movement(
        manager,
        {
          business_id,
          branch_id,
          performed_by_user_id: current_user.id,
          occurred_at: new Date(),
          movement_type: InventoryMovementHeaderType.STOCK_ADJUSTMENT,
          source_document_type: this.normalize_optional_string(
            dto.reference_type,
          ),
          source_document_id: dto.reference_id ?? null,
          source_document_number: null,
          notes: this.normalize_optional_string(dto.notes),
        },
        [
          {
            warehouse,
            product_variant,
            quantity: Number(dto.quantity),
            unit_cost: null,
            on_hand_delta: delta,
          },
        ],
      );
      movement_id = movement.id;
    });

    const movement = movement_id
      ? await this.inventory_movements_repository.find_by_id_in_business(
          movement_id,
          business_id,
        )
      : null;
    if (!movement) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_MOVEMENT_NOT_FOUND',
        messageKey: 'inventory.inventory_movement_not_found',
        details: {
          movement_id,
        },
      });
    }

    return movement;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
