import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { WarehouseBranchLinksRepository } from '../repositories/warehouse-branch-links.repository';
import { WarehouseLocationsRepository } from '../repositories/warehouse-locations.repository';
import { WarehousesRepository } from '../repositories/warehouses.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly warehouses_repository: WarehousesRepository,
    private readonly warehouse_branch_links_repository: WarehouseBranchLinksRepository,
    private readonly warehouse_locations_repository: WarehouseLocationsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_warehouses(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const warehouses = await this.warehouses_repository.find_all_by_business(
      business_id,
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
    );
    return warehouses.map((warehouse) => this.serialize_warehouse(warehouse));
  }

  async create_warehouse(
    current_user: AuthenticatedUserContext,
    dto: CreateWarehouseDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const branch =
      await this.inventory_validation_service.get_branch_for_operation(
        current_user,
        dto.branch_id,
      );

    if (
      await this.warehouses_repository.exists_name_in_branch(
        branch.id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'WAREHOUSE_NAME_DUPLICATE',
        messageKey: 'inventory.warehouse_name_duplicate',
        details: {
          field: 'name',
          branch_id: branch.id,
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('WH', dto.code);
    }

    if (dto.is_default) {
      await this.warehouses_repository.unset_default_for_branch(branch.id);
    }

    const saved_warehouse = await this.warehouses_repository.save(
      this.warehouses_repository.create({
        business_id,
        branch_id: branch.id,
        code: dto.code?.trim() ?? null,
        name: dto.name.trim(),
        description: this.normalize_optional_string(dto.description),
        uses_locations: dto.uses_locations ?? false,
        is_default: dto.is_default ?? false,
        is_active: dto.is_active ?? true,
      }),
    );
    await this.sync_primary_branch_link(saved_warehouse, branch.id);
    return this.serialize_warehouse(saved_warehouse);
  }

  async get_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ) {
    return this.serialize_warehouse(
      await this.get_warehouse_entity(current_user, warehouse_id),
    );
  }

  async update_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
    dto: UpdateWarehouseDto,
  ) {
    const warehouse = await this.get_warehouse_entity(
      current_user,
      warehouse_id,
    );
    const branch =
      dto.branch_id !== undefined
        ? await this.inventory_validation_service.get_branch_for_operation(
            current_user,
            dto.branch_id,
          )
        : null;

    const next_branch_id = branch?.id ?? warehouse.branch_id;
    const next_name = dto.name?.trim() ?? warehouse.name;
    if (
      await this.warehouses_repository.exists_name_in_branch(
        next_branch_id,
        next_name,
        warehouse.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'WAREHOUSE_NAME_DUPLICATE',
        messageKey: 'inventory.warehouse_name_duplicate',
        details: {
          field: 'name',
          branch_id: next_branch_id,
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('WH', dto.code.trim());
      warehouse.code = dto.code.trim();
    }
    if (branch) {
      warehouse.branch_id = branch.id;
    }
    if (dto.name) {
      warehouse.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      warehouse.description = this.normalize_optional_string(dto.description);
    }
    if (dto.uses_locations !== undefined) {
      warehouse.uses_locations = dto.uses_locations;
    }
    if (dto.is_default !== undefined) {
      if (dto.is_default) {
        await this.warehouses_repository.unset_default_for_branch(
          warehouse.branch_id,
          warehouse.id,
        );
      }
      warehouse.is_default = dto.is_default;
    }
    if (dto.is_active !== undefined) {
      warehouse.is_active = dto.is_active;
    }

    const saved_warehouse = await this.warehouses_repository.save(warehouse);
    await this.sync_primary_branch_link(saved_warehouse, saved_warehouse.branch_id);
    return this.serialize_warehouse(saved_warehouse);
  }

  async get_locations(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ) {
    const warehouse = await this.get_warehouse_entity(
      current_user,
      warehouse_id,
    );
    const locations =
      await this.warehouse_locations_repository.find_all_by_warehouse_in_business(
        warehouse.id,
        resolve_effective_business_id(current_user),
      );
    return locations.map((location) => this.serialize_location(location));
  }

  async create_location(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
    dto: CreateWarehouseLocationDto,
  ) {
    const warehouse = await this.get_warehouse_entity(
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

    return this.serialize_location(
      await this.warehouse_locations_repository.save(
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
      ),
    );
  }

  async get_location(
    current_user: AuthenticatedUserContext,
    location_id: number,
  ) {
    return this.serialize_location(
      await this.get_location_entity(current_user, location_id),
    );
  }

  async update_location(
    current_user: AuthenticatedUserContext,
    location_id: number,
    dto: UpdateWarehouseLocationDto,
  ) {
    const location = await this.get_location_entity(current_user, location_id);

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

    if (dto.code) {
      this.entity_code_service.validate_code('WL', dto.code.trim());
      location.code = dto.code.trim();
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

    return this.serialize_location(
      await this.warehouse_locations_repository.save(location),
    );
  }

  private async get_warehouse_entity(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<Warehouse> {
    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
      );
    if (!warehouse) {
      throw new DomainNotFoundException({
        code: 'WAREHOUSE_NOT_FOUND',
        messageKey: 'inventory.warehouse_not_found',
        details: {
          warehouse_id,
        },
      });
    }

    return warehouse;
  }

  private async get_location_entity(
    current_user: AuthenticatedUserContext,
    location_id: number,
  ): Promise<WarehouseLocation> {
    return this.inventory_validation_service.get_location_for_operation(
      current_user,
      location_id,
    );
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private async sync_primary_branch_link(
    warehouse: Warehouse,
    branch_id: number,
  ): Promise<void> {
    const existing_link =
      await this.warehouse_branch_links_repository.find_by_warehouse_and_branch(
        warehouse.business_id,
        warehouse.id,
        branch_id,
      );

    if (existing_link) {
      existing_link.is_active = true;
      existing_link.is_primary_for_sales = warehouse.is_default;
      existing_link.is_primary_for_purchases = warehouse.is_default;
      existing_link.priority = warehouse.is_default ? 1 : 100;
      await this.warehouse_branch_links_repository.save(existing_link);
    } else {
      await this.warehouse_branch_links_repository.save(
        this.warehouse_branch_links_repository.create({
          business_id: warehouse.business_id,
          warehouse_id: warehouse.id,
          branch_id,
          is_primary_for_sales: warehouse.is_default,
          is_primary_for_purchases: warehouse.is_default,
          priority: warehouse.is_default ? 1 : 100,
          is_active: true,
        }),
      );
    }

    await this.warehouse_branch_links_repository.deactivate_other_links(
      warehouse.business_id,
      warehouse.id,
      branch_id,
    );
  }

  private serialize_warehouse(warehouse: Warehouse) {
    return {
      id: warehouse.id,
      code: warehouse.code,
      business_id: warehouse.business_id,
      branch_id: warehouse.branch_id,
      name: warehouse.name,
      description: warehouse.description,
      purpose: warehouse.purpose,
      uses_locations: warehouse.uses_locations,
      is_default: warehouse.is_default,
      is_active: warehouse.is_active,
      created_at: warehouse.created_at,
      updated_at: warehouse.updated_at,
    };
  }

  private serialize_location(location: WarehouseLocation) {
    return {
      id: location.id,
      code: location.code,
      business_id: location.business_id,
      branch_id: location.branch_id,
      warehouse_id: location.warehouse_id,
      name: location.name,
      description: location.description,
      zone: location.zone,
      aisle: location.aisle,
      rack: location.rack,
      level: location.level,
      position: location.position,
      barcode: location.barcode,
      is_picking_area: location.is_picking_area,
      is_receiving_area: location.is_receiving_area,
      is_dispatch_area: location.is_dispatch_area,
      is_active: location.is_active,
      created_at: location.created_at,
      updated_at: location.updated_at,
    };
  }
}
