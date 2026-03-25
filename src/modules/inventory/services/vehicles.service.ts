import { Injectable } from '@nestjs/common';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { BranchAssignmentsView } from '../contracts/branch-assignments.view';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { SetBranchAssignmentsDto } from '../dto/set-branch-assignments.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { Vehicle } from '../entities/vehicle.entity';
import { VehicleBranchLinksRepository } from '../repositories/vehicle-branch-links.repository';
import { VehiclesRepository } from '../repositories/vehicles.repository';
import { DispatchCatalogValidationService } from './dispatch-catalog-validation.service';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehicles_repository: VehiclesRepository,
    private readonly vehicle_branch_links_repository: VehicleBranchLinksRepository,
    private readonly dispatch_catalog_validation_service: DispatchCatalogValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_vehicles(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const vehicles = await this.vehicles_repository.find_all_by_business(
      business_id,
      resolve_effective_branch_scope_ids(current_user),
    );
    return vehicles.map((vehicle) => this.serialize_vehicle(vehicle));
  }

  async create_vehicle(
    current_user: AuthenticatedUserContext,
    dto: CreateVehicleDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const assigned_branch_ids =
      this.dispatch_catalog_validation_service.normalize_branch_ids(
        dto.assigned_branch_ids,
      );
    const is_global = dto.is_global ?? assigned_branch_ids.length === 0;

    this.dispatch_catalog_validation_service.assert_non_global_requires_assignments(
      is_global,
      assigned_branch_ids,
      'VEHICLE_BRANCH_ASSIGNMENTS_REQUIRED',
      'inventory.vehicle_branch_assignments_required',
    );
    await this.dispatch_catalog_validation_service.assert_manageable_branch_ids(
      current_user,
      business_id,
      assigned_branch_ids,
    );

    if (
      await this.vehicles_repository.exists_plate_in_business(
        business_id,
        dto.plate_number.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'VEHICLE_PLATE_DUPLICATE',
        messageKey: 'inventory.vehicle_plate_duplicate',
        details: {
          field: 'plate_number',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('VH', dto.code);
    }

    const saved_vehicle = await this.vehicles_repository.save(
      this.vehicles_repository.create({
        business_id,
        code: dto.code?.trim() ?? null,
        is_global,
        plate_number: dto.plate_number.trim(),
        name: dto.name.trim(),
        vehicle_type: this.normalize_optional_string(dto.vehicle_type),
        max_weight_kg: dto.max_weight_kg ?? null,
        max_volume_m3: dto.max_volume_m3 ?? null,
        is_active: dto.is_active ?? true,
        notes: this.normalize_optional_string(dto.notes),
      }),
    );
    await this.sync_branch_assignments(saved_vehicle, assigned_branch_ids);

    const vehicle = await this.vehicles_repository.find_by_id_in_business(
      saved_vehicle.id,
      business_id,
    );
    return this.serialize_vehicle(vehicle!);
  }

  async get_vehicle(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
  ) {
    return this.serialize_vehicle(
      await this.get_vehicle_entity(current_user, vehicle_id),
    );
  }

  async get_vehicle_branch_assignments(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
  ): Promise<BranchAssignmentsView> {
    return this.serialize_branch_assignments_view(
      await this.get_vehicle(current_user, vehicle_id),
    );
  }

  async update_vehicle(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
    dto: UpdateVehicleDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const vehicle = await this.get_vehicle_entity(current_user, vehicle_id);
    const next_plate = dto.plate_number?.trim() ?? vehicle.plate_number;
    const next_branch_ids =
      dto.assigned_branch_ids !== undefined
        ? this.dispatch_catalog_validation_service.normalize_branch_ids(
            dto.assigned_branch_ids,
          )
        : this.dispatch_catalog_validation_service.get_active_branch_ids(vehicle);
    const next_is_global =
      this.dispatch_catalog_validation_service.resolve_next_global_state(
        vehicle.is_global,
        dto.is_global,
        dto.assigned_branch_ids,
      );

    this.dispatch_catalog_validation_service.assert_non_global_requires_assignments(
      next_is_global,
      next_branch_ids,
      'VEHICLE_BRANCH_ASSIGNMENTS_REQUIRED',
      'inventory.vehicle_branch_assignments_required',
    );
    await this.dispatch_catalog_validation_service.assert_manageable_branch_ids(
      current_user,
      business_id,
      next_branch_ids,
    );

    if (
      await this.vehicles_repository.exists_plate_in_business(
        business_id,
        next_plate,
        vehicle.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'VEHICLE_PLATE_DUPLICATE',
        messageKey: 'inventory.vehicle_plate_duplicate',
        details: {
          field: 'plate_number',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('VH', dto.code.trim());
      vehicle.code = dto.code.trim();
    }
    vehicle.is_global = next_is_global;
    if (dto.plate_number) {
      vehicle.plate_number = dto.plate_number.trim();
    }
    if (dto.name) {
      vehicle.name = dto.name.trim();
    }
    if (dto.vehicle_type !== undefined) {
      vehicle.vehicle_type = this.normalize_optional_string(dto.vehicle_type);
    }
    if (dto.max_weight_kg !== undefined) {
      vehicle.max_weight_kg = dto.max_weight_kg ?? null;
    }
    if (dto.max_volume_m3 !== undefined) {
      vehicle.max_volume_m3 = dto.max_volume_m3 ?? null;
    }
    if (dto.is_active !== undefined) {
      vehicle.is_active = dto.is_active;
    }
    if (dto.notes !== undefined) {
      vehicle.notes = this.normalize_optional_string(dto.notes);
    }

    const saved_vehicle = await this.vehicles_repository.save(vehicle);
    await this.sync_branch_assignments(saved_vehicle, next_branch_ids);
    const refreshed_vehicle = await this.vehicles_repository.find_by_id_in_business(
      saved_vehicle.id,
      business_id,
    );
    return this.serialize_vehicle(refreshed_vehicle!);
  }

  async set_vehicle_branch_assignments(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
    dto: SetBranchAssignmentsDto,
  ): Promise<BranchAssignmentsView> {
    return this.serialize_branch_assignments_view(
      await this.update_vehicle(current_user, vehicle_id, {
        is_global: dto.is_global,
        assigned_branch_ids: dto.assigned_branch_ids,
      }),
    );
  }

  async delete_vehicle(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
  ) {
    const vehicle = await this.get_vehicle_entity(current_user, vehicle_id);
    await this.vehicles_repository.remove(vehicle);
    return { id: vehicle_id };
  }

  private async get_vehicle_entity(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
  ): Promise<Vehicle> {
    const business_id = resolve_effective_business_id(current_user);
    const vehicle = await this.vehicles_repository.find_by_id_in_business(
      vehicle_id,
      business_id,
    );
    if (!vehicle) {
      throw new DomainNotFoundException({
        code: 'VEHICLE_NOT_FOUND',
        messageKey: 'inventory.vehicle_not_found',
        details: {
          vehicle_id,
        },
      });
    }

    this.dispatch_catalog_validation_service.assert_catalog_access(
      current_user,
      vehicle,
    );
    return vehicle;
  }

  private async sync_branch_assignments(
    vehicle: Vehicle,
    branch_ids: number[],
  ): Promise<void> {
    await this.vehicle_branch_links_repository.deactivate_all_by_vehicle(
      vehicle.business_id,
      vehicle.id,
    );
    if (vehicle.is_global) {
      return;
    }

    for (const branch_id of branch_ids) {
      const existing_link =
        await this.vehicle_branch_links_repository.find_by_vehicle_and_branch(
          vehicle.business_id,
          vehicle.id,
          branch_id,
        );
      if (existing_link) {
        existing_link.is_active = true;
        await this.vehicle_branch_links_repository.save(existing_link);
        continue;
      }

      await this.vehicle_branch_links_repository.save(
        this.vehicle_branch_links_repository.create({
          business_id: vehicle.business_id,
          vehicle_id: vehicle.id,
          branch_id,
          is_active: true,
        }),
      );
    }
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_branch_assignments_view(view: {
    id: number;
    code: string | null;
    name: string;
    is_global: boolean;
    assigned_branch_ids: number[];
    assigned_branches: Array<{ id: number; name: string | null }>;
  }): BranchAssignmentsView {
    return {
      id: view.id,
      code: view.code,
      name: view.name,
      is_global: view.is_global,
      assigned_branch_ids: view.assigned_branch_ids,
      assigned_branches: view.assigned_branches,
    };
  }

  private serialize_vehicle(vehicle: Vehicle) {
    return {
      id: vehicle.id,
      code: vehicle.code,
      business_id: vehicle.business_id,
      is_global: vehicle.is_global,
      plate_number: vehicle.plate_number,
      name: vehicle.name,
      vehicle_type: vehicle.vehicle_type,
      max_weight_kg: vehicle.max_weight_kg,
      max_volume_m3: vehicle.max_volume_m3,
      assigned_branch_ids:
        this.dispatch_catalog_validation_service.get_active_branch_ids(vehicle),
      assigned_branches: (vehicle.branch_links ?? [])
        .filter((branch_link) => branch_link.is_active)
        .map((branch_link) => ({
          id: branch_link.branch_id,
          name: branch_link.branch?.name ?? null,
        })),
      is_active: vehicle.is_active,
      notes: vehicle.notes,
      lifecycle: {
        can_delete: true,
        can_deactivate: vehicle.is_active,
        can_reactivate: !vehicle.is_active,
        reasons: [],
      },
      created_at: vehicle.created_at,
      updated_at: vehicle.updated_at,
    };
  }
}
