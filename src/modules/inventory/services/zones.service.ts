import { Injectable } from '@nestjs/common';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateZoneDto } from '../dto/create-zone.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { Zone } from '../entities/zone.entity';
import { ZonesRepository } from '../repositories/zones.repository';

@Injectable()
export class ZonesService {
  constructor(
    private readonly zones_repository: ZonesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_zones(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const zones =
      await this.zones_repository.find_all_by_business(business_id);
    return zones.map((zone) => this.serialize_zone(zone));
  }

  async create_zone(
    current_user: AuthenticatedUserContext,
    dto: CreateZoneDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    if (
      await this.zones_repository.exists_name_in_business(
        business_id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'ZONE_NAME_DUPLICATE',
        messageKey: 'inventory.zone_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('ZN', dto.code);
    }

    return this.serialize_zone(
      await this.zones_repository.save(
        this.zones_repository.create({
          business_id,
          code: dto.code?.trim() ?? null,
          name: dto.name.trim(),
          description: this.normalize_optional_string(dto.description),
          province: this.normalize_optional_string(dto.province),
          canton: this.normalize_optional_string(dto.canton),
          district: this.normalize_optional_string(dto.district),
          is_active: dto.is_active ?? true,
        }),
      ),
    );
  }

  async get_zone(current_user: AuthenticatedUserContext, zone_id: number) {
    return this.serialize_zone(
      await this.get_zone_entity(
        resolve_effective_business_id(current_user),
        zone_id,
      ),
    );
  }

  async update_zone(
    current_user: AuthenticatedUserContext,
    zone_id: number,
    dto: UpdateZoneDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const zone = await this.get_zone_entity(business_id, zone_id);
    const next_name = dto.name?.trim() ?? zone.name;

    if (
      await this.zones_repository.exists_name_in_business(
        business_id,
        next_name,
        zone.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'ZONE_NAME_DUPLICATE',
        messageKey: 'inventory.zone_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('ZN', dto.code.trim());
      zone.code = dto.code.trim();
    }
    if (dto.name) {
      zone.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      zone.description = this.normalize_optional_string(dto.description);
    }
    if (dto.province !== undefined) {
      zone.province = this.normalize_optional_string(dto.province);
    }
    if (dto.canton !== undefined) {
      zone.canton = this.normalize_optional_string(dto.canton);
    }
    if (dto.district !== undefined) {
      zone.district = this.normalize_optional_string(dto.district);
    }
    if (dto.is_active !== undefined) {
      zone.is_active = dto.is_active;
    }

    return this.serialize_zone(await this.zones_repository.save(zone));
  }

  async delete_zone(current_user: AuthenticatedUserContext, zone_id: number) {
    const business_id = resolve_effective_business_id(current_user);
    const zone = await this.get_zone_entity(business_id, zone_id);
    await this.zones_repository.remove(zone);
    return { id: zone_id };
  }

  private async get_zone_entity(
    business_id: number,
    zone_id: number,
  ): Promise<Zone> {
    const zone = await this.zones_repository.find_by_id_in_business(
      zone_id,
      business_id,
    );
    if (!zone) {
      throw new DomainNotFoundException({
        code: 'ZONE_NOT_FOUND',
        messageKey: 'inventory.zone_not_found',
        details: {
          zone_id,
        },
      });
    }

    return zone;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_zone(zone: Zone) {
    return {
      id: zone.id,
      code: zone.code,
      business_id: zone.business_id,
      name: zone.name,
      description: zone.description,
      province: zone.province,
      canton: zone.canton,
      district: zone.district,
      is_active: zone.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: zone.is_active,
        can_reactivate: !zone.is_active,
        reasons: [],
      },
      created_at: zone.created_at,
      updated_at: zone.updated_at,
    };
  }
}
