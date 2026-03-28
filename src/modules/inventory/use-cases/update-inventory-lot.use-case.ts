import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { UpdateInventoryLotDto } from '../dto/update-inventory-lot.dto';
import { InventoryLotAccessPolicy } from '../policies/inventory-lot-access.policy';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryLotSerializer } from '../serializers/inventory-lot.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type UpdateInventoryLotCommand = {
  current_user: AuthenticatedUserContext;
  inventory_lot_id: number;
  dto: UpdateInventoryLotDto;
};

@Injectable()
export class UpdateInventoryLotUseCase
  implements CommandUseCase<UpdateInventoryLotCommand, InventoryLotView>
{
  constructor(
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_lot_access_policy: InventoryLotAccessPolicy,
    private readonly inventory_lot_serializer: InventoryLotSerializer,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async execute({
    current_user,
    inventory_lot_id,
    dto,
  }: UpdateInventoryLotCommand): Promise<InventoryLotView> {
    const lot =
      await this.inventory_validation_service.get_inventory_lot_for_operation(
        current_user,
        inventory_lot_id,
      );
    this.inventory_lot_access_policy.assert_can_access_lot(current_user, lot);

    const business_id = resolve_effective_business_id(current_user);
    const location =
      dto.location_id !== undefined
        ? dto.location_id === null
          ? null
          : await this.inventory_validation_service.get_location_for_operation(
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
        lot.product_variant_id,
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

    if (
      dto.expiration_date === null &&
      (lot.product_variant?.track_expiration ?? lot.product?.track_expiration)
    ) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_LOT_EXPIRATION_REQUIRED',
        messageKey: 'inventory.inventory_lot_expiration_required',
        details: {
          field: 'expiration_date',
        },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('LT', dto.code.trim());
      }
      lot.code = dto.code?.trim() ?? null;
    }
    if (dto.location_id !== undefined) {
      lot.location_id = location?.id ?? null;
    }
    if (dto.lot_number) {
      lot.lot_number = dto.lot_number.trim();
    }
    if (dto.expiration_date !== undefined) {
      lot.expiration_date = this.normalize_optional_string(dto.expiration_date);
    }
    if (dto.manufacturing_date !== undefined) {
      lot.manufacturing_date = this.normalize_optional_string(
        dto.manufacturing_date,
      );
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

    const saved_lot = await this.inventory_lots_repository.save(lot);
    const persisted_lot = await this.inventory_lots_repository.find_by_id_in_business(
      saved_lot.id,
      business_id,
    );
    return this.inventory_lot_serializer.serialize(persisted_lot!);
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
