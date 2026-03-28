import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { WarehouseLocationView } from '../contracts/warehouse-location.view';
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseLocationsRepository } from '../repositories/warehouse-locations.repository';
import { WarehouseLocationSerializer } from '../serializers/warehouse-location.serializer';

export type UpdateWarehouseLocationCommand = {
  current_user: AuthenticatedUserContext;
  location_id: number;
  dto: UpdateWarehouseLocationDto;
};

@Injectable()
export class UpdateWarehouseLocationUseCase
  implements
    CommandUseCase<UpdateWarehouseLocationCommand, WarehouseLocationView>
{
  constructor(
    private readonly warehouse_locations_repository: WarehouseLocationsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly warehouse_location_serializer: WarehouseLocationSerializer,
  ) {}

  async execute({
    current_user,
    location_id,
    dto,
  }: UpdateWarehouseLocationCommand): Promise<WarehouseLocationView> {
    const location =
      await this.inventory_validation_service.get_location_for_operation(
        current_user,
        location_id,
      );

    if (
      dto.name &&
      (await this.warehouse_locations_repository.exists_name_in_warehouse(
        location.warehouse_id,
        dto.name.trim(),
        location.id,
      ))
    ) {
      throw new DomainConflictException({
        code: 'WAREHOUSE_LOCATION_NAME_DUPLICATE',
        messageKey: 'inventory.warehouse_location_name_duplicate',
        details: {
          field: 'name',
          warehouse_id: location.warehouse_id,
        },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('WL', dto.code.trim());
      }
      location.code = dto.code?.trim() ?? null;
    }
    if (dto.name) {
      location.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      location.description = this.normalize_optional_string(dto.description);
    }
    if (dto.zone !== undefined) {
      location.zone = this.normalize_optional_string(dto.zone);
    }
    if (dto.aisle !== undefined) {
      location.aisle = this.normalize_optional_string(dto.aisle);
    }
    if (dto.rack !== undefined) {
      location.rack = this.normalize_optional_string(dto.rack);
    }
    if (dto.level !== undefined) {
      location.level = this.normalize_optional_string(dto.level);
    }
    if (dto.position !== undefined) {
      location.position = this.normalize_optional_string(dto.position);
    }
    if (dto.barcode !== undefined) {
      location.barcode = this.normalize_optional_string(dto.barcode);
    }
    if (dto.is_picking_area !== undefined) {
      location.is_picking_area = dto.is_picking_area;
    }
    if (dto.is_receiving_area !== undefined) {
      location.is_receiving_area = dto.is_receiving_area;
    }
    if (dto.is_dispatch_area !== undefined) {
      location.is_dispatch_area = dto.is_dispatch_area;
    }
    if (dto.is_active !== undefined) {
      location.is_active = dto.is_active;
    }

    const saved_location = await this.warehouse_locations_repository.save(location);
    return this.warehouse_location_serializer.serialize(saved_location);
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
