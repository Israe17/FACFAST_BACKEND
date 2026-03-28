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
import { CreateRouteDto } from '../dto/create-route.dto';
import { SetBranchAssignmentsDto } from '../dto/set-branch-assignments.dto';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { Route } from '../entities/route.entity';
import { RouteBranchLinksRepository } from '../repositories/route-branch-links.repository';
import { RoutesRepository } from '../repositories/routes.repository';
import { DispatchCatalogValidationService } from './dispatch-catalog-validation.service';

@Injectable()
export class RoutesService {
  constructor(
    private readonly routes_repository: RoutesRepository,
    private readonly route_branch_links_repository: RouteBranchLinksRepository,
    private readonly dispatch_catalog_validation_service: DispatchCatalogValidationService,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_routes(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const routes = await this.routes_repository.find_all_by_business(
      business_id,
      resolve_effective_branch_scope_ids(current_user),
    );
    return routes.map((route) => this.serialize_route(route));
  }

  async create_route(
    current_user: AuthenticatedUserContext,
    dto: CreateRouteDto,
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
      'ROUTE_BRANCH_ASSIGNMENTS_REQUIRED',
      'inventory.route_branch_assignments_required',
    );
    await this.dispatch_catalog_validation_service.assert_manageable_branch_ids(
      current_user,
      business_id,
      assigned_branch_ids,
    );

    if (
      await this.routes_repository.exists_name_in_business(
        business_id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'ROUTE_NAME_DUPLICATE',
        messageKey: 'inventory.route_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('RT', dto.code);
    }

    await this.validate_route_catalog_references(current_user, {
      branch_ids: assigned_branch_ids,
      is_global,
      zone_id: dto.zone_id ?? null,
      default_driver_user_id: dto.default_driver_user_id ?? null,
      default_vehicle_id: dto.default_vehicle_id ?? null,
    });

    const saved_route = await this.routes_repository.save(
      this.routes_repository.create({
        business_id,
        code: dto.code?.trim() ?? null,
        is_global,
        name: dto.name.trim(),
        description: this.normalize_optional_string(dto.description),
        zone_id: dto.zone_id ?? null,
        default_driver_user_id: dto.default_driver_user_id ?? null,
        default_vehicle_id: dto.default_vehicle_id ?? null,
        estimated_cost: dto.estimated_cost ?? null,
        frequency: this.normalize_optional_string(dto.frequency),
        day_of_week: this.normalize_optional_string(dto.day_of_week),
        is_active: dto.is_active ?? true,
      }),
    );
    await this.sync_branch_assignments(saved_route, assigned_branch_ids);

    const route = await this.routes_repository.find_by_id_in_business(
      saved_route.id,
      business_id,
    );
    return this.serialize_route(route!);
  }

  async get_route(current_user: AuthenticatedUserContext, route_id: number) {
    return this.serialize_route(await this.get_route_entity(current_user, route_id));
  }

  async get_route_branch_assignments(
    current_user: AuthenticatedUserContext,
    route_id: number,
  ): Promise<BranchAssignmentsView> {
    return this.serialize_branch_assignments_view(
      await this.get_route(current_user, route_id),
    );
  }

  async update_route(
    current_user: AuthenticatedUserContext,
    route_id: number,
    dto: UpdateRouteDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const route = await this.get_route_entity(current_user, route_id);
    const next_name = dto.name?.trim() ?? route.name;
    const next_branch_ids =
      dto.assigned_branch_ids !== undefined
        ? this.dispatch_catalog_validation_service.normalize_branch_ids(
            dto.assigned_branch_ids,
          )
        : this.dispatch_catalog_validation_service.get_active_branch_ids(route);
    const next_is_global =
      this.dispatch_catalog_validation_service.resolve_next_global_state(
        route.is_global,
        dto.is_global,
        dto.assigned_branch_ids,
      );
    const effective_zone_id =
      dto.zone_id !== undefined ? dto.zone_id : route.zone_id;
    const effective_default_driver_user_id =
      dto.default_driver_user_id !== undefined
        ? dto.default_driver_user_id
        : route.default_driver_user_id;
    const effective_default_vehicle_id =
      dto.default_vehicle_id !== undefined
        ? dto.default_vehicle_id
        : route.default_vehicle_id;

    this.dispatch_catalog_validation_service.assert_non_global_requires_assignments(
      next_is_global,
      next_branch_ids,
      'ROUTE_BRANCH_ASSIGNMENTS_REQUIRED',
      'inventory.route_branch_assignments_required',
    );
    await this.dispatch_catalog_validation_service.assert_manageable_branch_ids(
      current_user,
      business_id,
      next_branch_ids,
    );

    if (
      await this.routes_repository.exists_name_in_business(
        business_id,
        next_name,
        route.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'ROUTE_NAME_DUPLICATE',
        messageKey: 'inventory.route_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    await this.validate_route_catalog_references(current_user, {
      branch_ids: next_branch_ids,
      is_global: next_is_global,
      zone_id: effective_zone_id ?? null,
      default_driver_user_id: effective_default_driver_user_id ?? null,
      default_vehicle_id: effective_default_vehicle_id ?? null,
    });

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('RT', dto.code.trim());
      }
      route.code = dto.code?.trim() ?? null;
    }
    route.is_global = next_is_global;
    if (dto.name) {
      route.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      route.description = this.normalize_optional_string(dto.description);
    }
    if (dto.zone_id !== undefined) {
      route.zone_id = dto.zone_id;
    }
    if (dto.default_driver_user_id !== undefined) {
      route.default_driver_user_id = dto.default_driver_user_id;
    }
    if (dto.default_vehicle_id !== undefined) {
      route.default_vehicle_id = dto.default_vehicle_id;
    }
    if (dto.estimated_cost !== undefined) {
      route.estimated_cost = dto.estimated_cost ?? null;
    }
    if (dto.frequency !== undefined) {
      route.frequency = this.normalize_optional_string(dto.frequency);
    }
    if (dto.day_of_week !== undefined) {
      route.day_of_week = this.normalize_optional_string(dto.day_of_week);
    }
    if (dto.is_active !== undefined) {
      route.is_active = dto.is_active;
    }

    const saved_route = await this.routes_repository.save(route);
    await this.sync_branch_assignments(saved_route, next_branch_ids);
    const refreshed_route = await this.routes_repository.find_by_id_in_business(
      saved_route.id,
      business_id,
    );
    return this.serialize_route(refreshed_route!);
  }

  async set_route_branch_assignments(
    current_user: AuthenticatedUserContext,
    route_id: number,
    dto: SetBranchAssignmentsDto,
  ): Promise<BranchAssignmentsView> {
    return this.serialize_branch_assignments_view(
      await this.update_route(current_user, route_id, {
        is_global: dto.is_global,
        assigned_branch_ids: dto.assigned_branch_ids,
      }),
    );
  }

  async delete_route(current_user: AuthenticatedUserContext, route_id: number) {
    const route = await this.get_route_entity(current_user, route_id);
    await this.routes_repository.remove(route);
    return { id: route_id };
  }

  private async get_route_entity(
    current_user: AuthenticatedUserContext,
    route_id: number,
  ): Promise<Route> {
    const business_id = resolve_effective_business_id(current_user);
    const route = await this.routes_repository.find_by_id_in_business(
      route_id,
      business_id,
    );
    if (!route) {
      throw new DomainNotFoundException({
        code: 'ROUTE_NOT_FOUND',
        messageKey: 'inventory.route_not_found',
        details: {
          route_id,
        },
      });
    }

    this.dispatch_catalog_validation_service.assert_catalog_access(
      current_user,
      route,
    );
    return route;
  }

  private async sync_branch_assignments(
    route: Route,
    branch_ids: number[],
  ): Promise<void> {
    await this.route_branch_links_repository.deactivate_all_by_route(
      route.business_id,
      route.id,
    );
    if (route.is_global) {
      return;
    }

    for (const branch_id of branch_ids) {
      const existing_link =
        await this.route_branch_links_repository.find_by_route_and_branch(
          route.business_id,
          route.id,
          branch_id,
        );
      if (existing_link) {
        existing_link.is_active = true;
        await this.route_branch_links_repository.save(existing_link);
        continue;
      }

      await this.route_branch_links_repository.save(
        this.route_branch_links_repository.create({
          business_id: route.business_id,
          route_id: route.id,
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

  private async validate_route_catalog_references(
    current_user: AuthenticatedUserContext,
    input: {
      branch_ids: number[];
      is_global: boolean;
      zone_id?: number | null;
      default_driver_user_id?: number | null;
      default_vehicle_id?: number | null;
    },
  ): Promise<void> {
    if (input.zone_id !== undefined && input.zone_id !== null) {
      await this.validate_branch_scoped_reference(
        input.branch_ids,
        input.is_global,
        async (branch_id) =>
          this.dispatch_catalog_validation_service.get_zone_for_branch_operation(
            current_user,
            input.zone_id!,
            branch_id,
            { require_active: true },
          ),
        () =>
          this.dispatch_catalog_validation_service.get_zone_in_business(
            current_user,
            input.zone_id!,
            { require_active: true },
          ),
      );
    }

    if (
      input.default_driver_user_id !== undefined &&
      input.default_driver_user_id !== null
    ) {
      await this.validate_branch_scoped_reference(
        input.branch_ids,
        input.is_global,
        async (branch_id) =>
          this.dispatch_catalog_validation_service.get_driver_user_for_dispatch_operation(
            current_user,
            input.default_driver_user_id!,
            branch_id,
            { require_active: true, allow_owner_or_global_scope: true },
          ),
        () =>
          this.dispatch_catalog_validation_service.get_driver_user_for_dispatch_operation(
            current_user,
            input.default_driver_user_id!,
            null,
            { require_active: true, allow_owner_or_global_scope: true },
          ),
      );
    }

    if (
      input.default_vehicle_id !== undefined &&
      input.default_vehicle_id !== null
    ) {
      await this.validate_branch_scoped_reference(
        input.branch_ids,
        input.is_global,
        async (branch_id) =>
          this.dispatch_catalog_validation_service.get_vehicle_for_branch_operation(
            current_user,
            input.default_vehicle_id!,
            branch_id,
            { require_active: true },
          ),
        () =>
          this.dispatch_catalog_validation_service.get_vehicle_in_business(
            current_user,
            input.default_vehicle_id!,
            { require_active: true },
          ),
      );
    }
  }

  private async validate_branch_scoped_reference(
    branch_ids: number[],
    is_global: boolean,
    branch_validator: (branch_id: number) => Promise<unknown>,
    global_validator: () => Promise<unknown>,
  ): Promise<void> {
    if (!is_global && branch_ids.length > 0) {
      for (const branch_id of branch_ids) {
        await branch_validator(branch_id);
      }
      return;
    }

    await global_validator();
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

  private serialize_route(route: Route) {
    return {
      id: route.id,
      code: route.code,
      business_id: route.business_id,
      is_global: route.is_global,
      name: route.name,
      description: route.description,
      zone: route.zone
        ? { id: route.zone.id, name: route.zone.name }
        : null,
      zone_id: route.zone_id,
      default_driver: route.default_driver
        ? { id: route.default_driver.id, name: route.default_driver.name }
        : null,
      default_driver_user_id: route.default_driver_user_id,
      default_vehicle: route.default_vehicle
        ? {
            id: route.default_vehicle.id,
            name: route.default_vehicle.name,
            plate_number: route.default_vehicle.plate_number,
          }
        : null,
      default_vehicle_id: route.default_vehicle_id,
      estimated_cost: route.estimated_cost,
      frequency: route.frequency,
      day_of_week: route.day_of_week,
      assigned_branch_ids:
        this.dispatch_catalog_validation_service.get_active_branch_ids(route),
      assigned_branches: (route.branch_links ?? [])
        .filter((branch_link) => branch_link.is_active)
        .map((branch_link) => ({
          id: branch_link.branch_id,
          name: branch_link.branch?.name ?? null,
        })),
      is_active: route.is_active,
      lifecycle: {
        can_delete: true,
        can_deactivate: route.is_active,
        can_reactivate: !route.is_active,
        reasons: [],
      },
      created_at: route.created_at,
      updated_at: route.updated_at,
    };
  }
}
