import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { CreateInventoryLotDto } from '../dto/create-inventory-lot.dto';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryLotSerializer } from '../serializers/inventory-lot.serializer';
import { InventoryAdjustmentsService } from '../services/inventory-adjustments.service';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { ProductVariantsService } from '../services/product-variants.service';

export type CreateInventoryLotCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateInventoryLotDto;
};

@Injectable()
export class CreateInventoryLotUseCase
  implements CommandUseCase<CreateInventoryLotCommand, InventoryLotView>
{
  constructor(
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_adjustments_service: InventoryAdjustmentsService,
    private readonly entity_code_service: EntityCodeService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly inventory_lot_serializer: InventoryLotSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateInventoryLotCommand): Promise<InventoryLotView> {
    const business_id = resolve_effective_business_id(current_user);
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.warehouse_id,
        {
          require_active: true,
        },
      );
    const location =
      dto.location_id !== undefined && dto.location_id !== null
        ? await this.inventory_validation_service.get_location_for_operation(
            current_user,
            dto.location_id,
            {
              require_active: true,
            },
          )
        : null;
    if (location) {
      this.inventory_validation_service.assert_location_belongs_to_warehouse(
        location,
        warehouse.id,
      );
    }

    const { product, product_variant } =
      await this.product_variants_service.resolve_product_and_variant_for_operation(
        business_id,
        {
          product_id: dto.product_id,
          product_variant_id: dto.product_variant_id,
        },
      );
    this.inventory_validation_service.assert_product_is_inventory_enabled(
      product,
    );
    this.inventory_validation_service.assert_variant_is_inventory_enabled(
      product_variant,
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
        code: this.normalize_optional_string(dto.code),
        lot_number: dto.lot_number.trim(),
        expiration_date: this.normalize_optional_string(dto.expiration_date),
        manufacturing_date: this.normalize_optional_string(
          dto.manufacturing_date,
        ),
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

    const persisted_lot =
      await this.inventory_validation_service.get_inventory_lot_for_operation(
        current_user,
        lot.id,
      );
    return this.inventory_lot_serializer.serialize(persisted_lot);
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
