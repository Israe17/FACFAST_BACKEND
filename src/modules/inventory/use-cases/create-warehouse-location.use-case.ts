import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { WarehouseLocationView } from '../contracts/warehouse-location.view';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { WarehouseLocationsRepository } from '../repositories/warehouse-locations.repository';
import { WarehouseLocationSerializer } from '../serializers/warehouse-location.serializer';

export type CreateWarehouseLocationCommand = {
  current_user: AuthenticatedUserContext;
  warehouse_id: number;
  dto: CreateWarehouseLocationDto;
};

@Injectable()
export class CreateWarehouseLocationUseCase
  implements
    CommandUseCase<CreateWarehouseLocationCommand, WarehouseLocationView>
{
  constructor(
    private readonly warehouse_locations_repository: WarehouseLocationsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly warehouse_location_serializer: WarehouseLocationSerializer,
  ) {}

  async execute({
    current_user,
    warehouse_id,
    dto,
  }: CreateWarehouseLocationCommand): Promise<WarehouseLocationView> {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    if (!warehouse.uses_locations) {
      throw new DomainBadRequestException({
        code: 'WAREHOUSE_LOCATIONS_DISABLED',
        messageKey: 'inventory.warehouse_locations_disabled',
        details: {
          warehouse_id: warehouse.id,
        },
      });
    }

    if (
      await this.warehouse_locations_repository.exists_name_in_warehouse(
        warehouse.id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'WAREHOUSE_LOCATION_NAME_DUPLICATE',
        messageKey: 'inventory.warehouse_location_name_duplicate',
        details: {
          field: 'name',
          warehouse_id: warehouse.id,
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('WL', dto.code);
    }

    const location = await this.warehouse_locations_repository.save(
      this.warehouse_locations_repository.create({
        business_id: resolve_effective_business_id(current_user),
        branch_id: warehouse.branch_id,
        warehouse_id: warehouse.id,
        code: dto.code?.trim() ?? null,
        name: dto.name.trim(),
        description: this.normalize_optional_string(dto.description),
        zone: this.normalize_optional_string(dto.zone),
        aisle: this.normalize_optional_string(dto.aisle),
        rack: this.normalize_optional_string(dto.rack),
        level: this.normalize_optional_string(dto.level),
        position: this.normalize_optional_string(dto.position),
        barcode: this.normalize_optional_string(dto.barcode),
        is_picking_area: dto.is_picking_area ?? false,
        is_receiving_area: dto.is_receiving_area ?? false,
        is_dispatch_area: dto.is_dispatch_area ?? false,
        is_active: dto.is_active ?? true,
      }),
    );

    return this.warehouse_location_serializer.serialize(location);
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
