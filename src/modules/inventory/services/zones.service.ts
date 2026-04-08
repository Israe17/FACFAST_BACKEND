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
import { CreateZoneDto } from '../dto/create-zone.dto';
import { SetBranchAssignmentsDto } from '../dto/set-branch-assignments.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { Zone } from '../entities/zone.entity';
import { ZoneBranchLinksRepository } from '../repositories/zone-branch-links.repository';
import { ZonesRepository } from '../repositories/zones.repository';
import { DispatchCatalogValidationService } from './dispatch-catalog-validation.service';

@Injectable()
export class ZonesService {
  constructor(
    private readonly zones_repository: ZonesRepository,
    private readonly zone_branch_links_repository: ZoneBranchLinksRepository,
    private readonly dispatch_catalog_validation_service: DispatchCatalogValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_zones(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const zones = await this.zones_repository.find_all_by_business(
      business_id,
      resolve_effective_branch_scope_ids(current_user),
    );
    return zones.map((zone) => this.serialize_zone(zone));
  }

  async create_zone(
    current_user: AuthenticatedUserContext,
    dto: CreateZoneDto,
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
      'ZONE_BRANCH_ASSIGNMENTS_REQUIRED',
      'inventory.zone_branch_assignments_required',
    );
    await this.dispatch_catalog_validation_service.assert_manageable_branch_ids(
      current_user,
      business_id,
      assigned_branch_ids,
    );

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

    const saved_zone = await this.zones_repository.save(
      this.zones_repository.create({
        business_id,
        code: dto.code?.trim() ?? null,
        is_global,
        name: dto.name.trim(),
        description: this.normalize_optional_string(dto.description),
        province: this.normalize_optional_string(dto.province),
        canton: this.normalize_optional_string(dto.canton),
        district: this.normalize_optional_string(dto.district),
        is_active: dto.is_active ?? true,
        boundary: dto.boundary ?? null,
      }),
    );
    await this.sync_branch_assignments(saved_zone, assigned_branch_ids);

    const zone = await this.zones_repository.find_by_id_in_business(
      saved_zone.id,
      business_id,
    );
    return this.serialize_zone(zone!);
  }

  async get_zone(current_user: AuthenticatedUserContext, zone_id: number) {
    return this.serialize_zone(await this.get_zone_entity(current_user, zone_id));
  }

  async get_zone_branch_assignments(
    current_user: AuthenticatedUserContext,
    zone_id: number,
  ): Promise<BranchAssignmentsView> {
    return this.serialize_branch_assignments_view(
      await this.get_zone(current_user, zone_id),
    );
  }

  async update_zone(
    current_user: AuthenticatedUserContext,
    zone_id: number,
    dto: UpdateZoneDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const zone = await this.get_zone_entity(current_user, zone_id);
    const next_name = dto.name?.trim() ?? zone.name;
    const next_branch_ids =
      dto.assigned_branch_ids !== undefined
        ? this.dispatch_catalog_validation_service.normalize_branch_ids(
            dto.assigned_branch_ids,
          )
        : this.dispatch_catalog_validation_service.get_active_branch_ids(zone);
    const next_is_global =
      this.dispatch_catalog_validation_service.resolve_next_global_state(
        zone.is_global,
        dto.is_global,
        dto.assigned_branch_ids,
      );

    this.dispatch_catalog_validation_service.assert_non_global_requires_assignments(
      next_is_global,
      next_branch_ids,
      'ZONE_BRANCH_ASSIGNMENTS_REQUIRED',
      'inventory.zone_branch_assignments_required',
    );
    await this.dispatch_catalog_validation_service.assert_manageable_branch_ids(
      current_user,
      business_id,
      next_branch_ids,
    );

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

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('ZN', dto.code.trim());
      }
      zone.code = dto.code?.trim() ?? null;
    }
    zone.is_global = next_is_global;
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
    if (dto.boundary !== undefined) {
      zone.boundary = dto.boundary ?? null;
    }

    const saved_zone = await this.zones_repository.save(zone);
    await this.sync_branch_assignments(saved_zone, next_branch_ids);
    const refreshed_zone = await this.zones_repository.find_by_id_in_business(
      saved_zone.id,
      business_id,
    );
    return this.serialize_zone(refreshed_zone!);
  }

  async set_zone_branch_assignments(
    current_user: AuthenticatedUserContext,
    zone_id: number,
    dto: SetBranchAssignmentsDto,
  ): Promise<BranchAssignmentsView> {
    return this.serialize_branch_assignments_view(
      await this.update_zone(current_user, zone_id, {
        is_global: dto.is_global,
        assigned_branch_ids: dto.assigned_branch_ids,
      }),
    );
  }

  async delete_zone(current_user: AuthenticatedUserContext, zone_id: number) {
    const zone = await this.get_zone_entity(current_user, zone_id);
    await this.zones_repository.remove(zone);
    return { id: zone_id };
  }

  private async get_zone_entity(
    current_user: AuthenticatedUserContext,
    zone_id: number,
  ): Promise<Zone> {
    const business_id = resolve_effective_business_id(current_user);
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

    this.dispatch_catalog_validation_service.assert_catalog_access(
      current_user,
      zone,
    );
    return zone;
  }

  private async sync_branch_assignments(
    zone: Zone,
    branch_ids: number[],
  ): Promise<void> {
    await this.zone_branch_links_repository.deactivate_all_by_zone(
      zone.business_id,
      zone.id,
    );
    if (zone.is_global) {
      return;
    }

    for (const branch_id of branch_ids) {
      const existing_link =
        await this.zone_branch_links_repository.find_by_zone_and_branch(
          zone.business_id,
          zone.id,
          branch_id,
        );
      if (existing_link) {
        existing_link.is_active = true;
        await this.zone_branch_links_repository.save(existing_link);
        continue;
      }

      await this.zone_branch_links_repository.save(
        this.zone_branch_links_repository.create({
          business_id: zone.business_id,
          zone_id: zone.id,
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

  private serialize_zone(zone: Zone) {
    return {
      id: zone.id,
      code: zone.code,
      business_id: zone.business_id,
      is_global: zone.is_global,
      name: zone.name,
      description: zone.description,
      province: zone.province,
      canton: zone.canton,
      district: zone.district,
      center_latitude: zone.center_latitude ?? null,
      center_longitude: zone.center_longitude ?? null,
      boundary: zone.boundary ?? null,
      assigned_branch_ids:
        this.dispatch_catalog_validation_service.get_active_branch_ids(zone),
      assigned_branches: (zone.branch_links ?? [])
        .filter((branch_link) => branch_link.is_active)
        .map((branch_link) => ({
          id: branch_link.branch_id,
          name: branch_link.branch?.name ?? null,
        })),
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
