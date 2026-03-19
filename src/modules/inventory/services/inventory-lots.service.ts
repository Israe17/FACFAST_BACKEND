import { Injectable } from '@nestjs/common';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { CreateInventoryLotDto } from '../dto/create-inventory-lot.dto';
import { UpdateInventoryLotDto } from '../dto/update-inventory-lot.dto';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';
import { InventoryValidationService } from './inventory-validation.service';
import { ProductVariantsService } from './product-variants.service';

@Injectable()
export class InventoryLotsService {
  constructor(
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_adjustments_service: InventoryAdjustmentsService,
    private readonly entity_code_service: EntityCodeService,
    private readonly product_variants_service: ProductVariantsService,
  ) {}

  async get_lots(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const lots = await this.inventory_lots_repository.find_all_by_business(
      business_id,
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
    );
    return lots.map((lot) => this.serialize_lot(lot));
  }

  async get_lots_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    return this.inventory_lots_repository.find_paginated_by_business(
      business_id,
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
      query,
      (lot) => this.serialize_lot(lot),
    );
  }

  async create_lot(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryLotDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.warehouse_id,
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

    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        dto.product_id,
      );
    this.inventory_validation_service.assert_product_is_inventory_enabled(
      product,
    );

    const product_variant =
      await this.product_variants_service.resolve_variant_for_operation(
        business_id,
        product,
        dto.product_variant_id,
      );

    if (!product_variant.track_lots) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_LOT_TRACKING_REQUIRED',
        messageKey: 'inventory.product_lot_tracking_required',
        details: {
          product_id: product.id,
        },
      });
    }

    if (product_variant.track_expiration && !dto.expiration_date) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_LOT_EXPIRATION_REQUIRED',
        messageKey: 'inventory.inventory_lot_expiration_required',
        details: {
          field: 'expiration_date',
        },
      });
    }

    if (
      await this.inventory_lots_repository.exists_lot_in_warehouse(
        warehouse.id,
        product.id,
        dto.lot_number.trim(),
        undefined,
        product_variant.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'INVENTORY_LOT_NUMBER_DUPLICATE',
        messageKey: 'inventory.inventory_lot_number_duplicate',
        details: {
          field: 'lot_number',
          warehouse_id: warehouse.id,
          product_id: product.id,
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('LT', dto.code);
    }

    if (
      dto.supplier_contact_id !== undefined &&
      dto.supplier_contact_id !== null
    ) {
      await this.inventory_validation_service.assert_supplier_contact_in_business(
        business_id,
        dto.supplier_contact_id,
      );
    }

    const lot = await this.inventory_lots_repository.save(
      this.inventory_lots_repository.create({
        business_id,
        branch_id: warehouse.branch_id,
        warehouse_id: warehouse.id,
        location_id: location?.id ?? null,
        product_id: product.id,
        product_variant_id: product_variant.id,
        code: dto.code?.trim() ?? null,
        lot_number: dto.lot_number.trim(),
        expiration_date: dto.expiration_date?.trim() ?? null,
        manufacturing_date: dto.manufacturing_date?.trim() ?? null,
        received_at: dto.received_at ? new Date(dto.received_at) : null,
        initial_quantity: dto.initial_quantity,
        current_quantity: 0,
        unit_cost: dto.unit_cost ?? null,
        supplier_contact_id: dto.supplier_contact_id ?? null,
        is_active: dto.is_active ?? true,
      }),
    );

    if (dto.initial_quantity > 0) {
      const adjustment_dto: CreateInventoryAdjustmentDto = {
        warehouse_id: warehouse.id,
        location_id: location?.id ?? null,
        product_id: product.id,
        product_variant_id: product_variant.id,
        inventory_lot_id: lot.id,
        movement_type: InventoryMovementType.ADJUSTMENT_IN,
        quantity: dto.initial_quantity,
        reference_type: 'inventory_lot',
        reference_id: lot.id,
        notes: 'Initial lot balance.',
      };
      await this.inventory_adjustments_service.adjust_inventory(
        current_user,
        adjustment_dto,
      );
    }

    return this.serialize_lot(await this.get_lot_entity(current_user, lot.id));
  }

  async get_lot(current_user: AuthenticatedUserContext, lot_id: number) {
    return this.serialize_lot(await this.get_lot_entity(current_user, lot_id));
  }

  async update_lot(
    current_user: AuthenticatedUserContext,
    lot_id: number,
    dto: UpdateInventoryLotDto,
  ) {
    const lot = await this.get_lot_entity(current_user, lot_id);
    const business_id = resolve_effective_business_id(current_user);

    const location =
      dto.location_id !== undefined
        ? dto.location_id === null
          ? null
          : await this.inventory_validation_service.get_location_for_operation(
              current_user,
              dto.location_id,
            )
        : null;
    if (location) {
      this.inventory_validation_service.assert_location_belongs_to_warehouse(
        location,
        lot.warehouse_id,
      );
    }

    const next_lot_number = dto.lot_number?.trim() ?? lot.lot_number;
    if (
      await this.inventory_lots_repository.exists_lot_in_warehouse(
        lot.warehouse_id,
        lot.product_id,
        next_lot_number,
        lot.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'INVENTORY_LOT_NUMBER_DUPLICATE',
        messageKey: 'inventory.inventory_lot_number_duplicate',
        details: {
          field: 'lot_number',
          warehouse_id: lot.warehouse_id,
          product_id: lot.product_id,
        },
      });
    }

    if (dto.expiration_date === null && lot.product?.track_expiration) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_LOT_EXPIRATION_REQUIRED',
        messageKey: 'inventory.inventory_lot_expiration_required',
        details: {
          field: 'expiration_date',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('LT', dto.code.trim());
      lot.code = dto.code.trim();
    }
    if (dto.location_id !== undefined) {
      lot.location_id = location?.id ?? null;
    }
    if (dto.lot_number) {
      lot.lot_number = dto.lot_number.trim();
    }
    if (dto.expiration_date !== undefined) {
      lot.expiration_date = dto.expiration_date?.trim() ?? null;
    }
    if (dto.manufacturing_date !== undefined) {
      lot.manufacturing_date = dto.manufacturing_date?.trim() ?? null;
    }
    if (dto.received_at !== undefined) {
      lot.received_at = dto.received_at ? new Date(dto.received_at) : null;
    }
    if (dto.unit_cost !== undefined) {
      lot.unit_cost = dto.unit_cost;
    }
    if (dto.supplier_contact_id !== undefined) {
      if (dto.supplier_contact_id === null) {
        lot.supplier_contact_id = null;
      } else {
        await this.inventory_validation_service.assert_supplier_contact_in_business(
          business_id,
          dto.supplier_contact_id,
        );
        lot.supplier_contact_id = dto.supplier_contact_id;
      }
    }
    if (dto.is_active !== undefined) {
      lot.is_active = dto.is_active;
    }

    return this.serialize_lot(await this.inventory_lots_repository.save(lot));
  }

  async deactivate_lot(current_user: AuthenticatedUserContext, lot_id: number) {
    const lot = await this.get_lot_entity(current_user, lot_id);
    lot.is_active = false;
    return this.serialize_lot(await this.inventory_lots_repository.save(lot));
  }

  private async get_lot_entity(
    current_user: AuthenticatedUserContext,
    lot_id: number,
  ): Promise<InventoryLot> {
    const lot =
      await this.inventory_validation_service.get_inventory_lot_for_operation(
        current_user,
        lot_id,
      );
    if (!lot) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_LOT_NOT_FOUND',
        messageKey: 'inventory.inventory_lot_not_found',
        details: {
          lot_id,
        },
      });
    }

    return lot;
  }

  private serialize_lot(lot: InventoryLot) {
    return {
      id: lot.id,
      code: lot.code,
      business_id: lot.business_id,
      branch_id: lot.branch_id,
      warehouse: lot.warehouse
        ? {
            id: lot.warehouse.id,
            code: lot.warehouse.code,
            name: lot.warehouse.name,
          }
        : {
            id: lot.warehouse_id,
          },
      location: lot.location
        ? {
            id: lot.location.id,
            code: lot.location.code,
            name: lot.location.name,
          }
        : null,
      product: lot.product
        ? {
            id: lot.product.id,
            code: lot.product.code,
            name: lot.product.name,
          }
        : {
            id: lot.product_id,
          },
      product_variant: lot.product_variant
        ? {
            id: lot.product_variant.id,
            sku: lot.product_variant.sku,
            variant_name: lot.product_variant.variant_name,
            is_default: lot.product_variant.is_default,
          }
        : null,
      lot_number: lot.lot_number,
      expiration_date: lot.expiration_date,
      manufacturing_date: lot.manufacturing_date,
      received_at: lot.received_at,
      initial_quantity: lot.initial_quantity,
      current_quantity: lot.current_quantity,
      unit_cost: lot.unit_cost,
      supplier_contact: lot.supplier_contact
        ? {
            id: lot.supplier_contact.id,
            code: lot.supplier_contact.code,
            name: lot.supplier_contact.name,
          }
        : null,
      is_active: lot.is_active,
      created_at: lot.created_at,
      updated_at: lot.updated_at,
    };
  }
}
