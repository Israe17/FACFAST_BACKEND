import { Injectable } from '@nestjs/common';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { Vehicle } from '../entities/vehicle.entity';
import { VehiclesRepository } from '../repositories/vehicles.repository';

@Injectable()
export class VehiclesService {
  constructor(
    private readonly vehicles_repository: VehiclesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_vehicles(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const vehicles =
      await this.vehicles_repository.find_all_by_business(business_id);
    return vehicles.map((vehicle) => this.serialize_vehicle(vehicle));
  }

  async create_vehicle(
    current_user: AuthenticatedUserContext,
    dto: CreateVehicleDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
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

    return this.serialize_vehicle(
      await this.vehicles_repository.save(
        this.vehicles_repository.create({
          business_id,
          code: dto.code?.trim() ?? null,
          plate_number: dto.plate_number.trim(),
          name: dto.name.trim(),
          vehicle_type: this.normalize_optional_string(dto.vehicle_type),
          max_weight_kg: dto.max_weight_kg ?? null,
          max_volume_m3: dto.max_volume_m3 ?? null,
          is_active: dto.is_active ?? true,
          notes: this.normalize_optional_string(dto.notes),
        }),
      ),
    );
  }

  async get_vehicle(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
  ) {
    return this.serialize_vehicle(
      await this.get_vehicle_entity(
        resolve_effective_business_id(current_user),
        vehicle_id,
      ),
    );
  }

  async update_vehicle(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
    dto: UpdateVehicleDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const vehicle = await this.get_vehicle_entity(business_id, vehicle_id);
    const next_plate = dto.plate_number?.trim() ?? vehicle.plate_number;

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

    return this.serialize_vehicle(
      await this.vehicles_repository.save(vehicle),
    );
  }

  async delete_vehicle(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const vehicle = await this.get_vehicle_entity(business_id, vehicle_id);

    await this.vehicles_repository.remove(vehicle);
    return { id: vehicle_id };
  }

  private async get_vehicle_entity(
    business_id: number,
    vehicle_id: number,
  ): Promise<Vehicle> {
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

    return vehicle;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_vehicle(vehicle: Vehicle) {
    return {
      id: vehicle.id,
      code: vehicle.code,
      business_id: vehicle.business_id,
      plate_number: vehicle.plate_number,
      name: vehicle.name,
      vehicle_type: vehicle.vehicle_type,
      max_weight_kg: vehicle.max_weight_kg,
      max_volume_m3: vehicle.max_volume_m3,
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
