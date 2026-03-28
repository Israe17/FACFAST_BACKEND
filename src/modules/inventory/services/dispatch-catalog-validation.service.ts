import { Injectable } from '@nestjs/common';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { Route } from '../entities/route.entity';
import { Vehicle } from '../entities/vehicle.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { Zone } from '../entities/zone.entity';
import { RoutesRepository } from '../repositories/routes.repository';
import { VehiclesRepository } from '../repositories/vehicles.repository';
import { ZonesRepository } from '../repositories/zones.repository';
import { User } from '../../users/entities/user.entity';
import { UsersRepository } from '../../users/repositories/users.repository';
import { InventoryValidationService } from './inventory-validation.service';

type ActiveLookupOptions = {
  require_active?: boolean;
};

type DriverLookupOptions = ActiveLookupOptions & {
  allow_owner_or_global_scope?: boolean;
};

type BranchScopedCatalog = {
  id: number;
  is_active: boolean;
  is_global: boolean;
  branch_links?: Array<{
    branch_id: number;
    is_active: boolean;
  }>;
};

@Injectable()
export class DispatchCatalogValidationService {
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly zones_repository: ZonesRepository,
    private readonly routes_repository: RoutesRepository,
    private readonly vehicles_repository: VehiclesRepository,
    private readonly users_repository: UsersRepository,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async assert_manageable_branch_ids(
    current_user: AuthenticatedUserContext,
    business_id: number,
    branch_ids: number[],
  ): Promise<void> {
    const normalized_branch_ids = Array.from(new Set(branch_ids));
    if (!normalized_branch_ids.length) {
      return;
    }

    this.branch_access_policy.assert_manageable_branch_ids(
      current_user,
      normalized_branch_ids,
    );

    const branches = await this.branches_repository.find_many_by_ids_in_business(
      normalized_branch_ids,
      business_id,
    );
    if (branches.length !== normalized_branch_ids.length) {
      const found_branch_ids = new Set(branches.map((branch) => branch.id));
      const missing_branch_id = normalized_branch_ids.find(
        (branch_id) => !found_branch_ids.has(branch_id),
      );
      throw new DomainNotFoundException({
        code: 'BRANCH_NOT_FOUND',
        messageKey: 'branches.not_found',
        details: {
          branch_id: missing_branch_id,
        },
      });
    }
  }

  async get_zone_for_branch_operation(
    current_user: AuthenticatedUserContext,
    zone_id: number,
    branch_id: number,
    options?: ActiveLookupOptions,
  ): Promise<Zone> {
    const zone = await this.get_zone_in_business(current_user, zone_id, options);
    this.assert_entity_available_in_branch(
      zone,
      branch_id,
      'ZONE_NOT_AVAILABLE_FOR_BRANCH',
      'inventory.zone_not_available_for_branch',
      {
        zone_id,
        branch_id,
      },
    );
    return zone;
  }

  async get_zone_in_business(
    current_user: AuthenticatedUserContext,
    zone_id: number,
    options?: ActiveLookupOptions,
  ): Promise<Zone> {
    const zone = await this.zones_repository.find_by_id_in_business(
      zone_id,
      resolve_effective_business_id(current_user),
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

    this.assert_entity_is_active(
      zone,
      options?.require_active ?? false,
      'ZONE_INACTIVE',
      'inventory.zone_inactive',
      {
        zone_id,
      },
    );
    return zone;
  }

  async get_route_for_branch_operation(
    current_user: AuthenticatedUserContext,
    route_id: number,
    branch_id: number,
    options?: ActiveLookupOptions,
  ): Promise<Route> {
    const route = await this.routes_repository.find_by_id_in_business(
      route_id,
      resolve_effective_business_id(current_user),
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

    this.assert_entity_is_active(
      route,
      options?.require_active ?? false,
      'ROUTE_INACTIVE',
      'inventory.route_inactive',
      {
        route_id,
      },
    );
    this.assert_entity_available_in_branch(
      route,
      branch_id,
      'ROUTE_NOT_AVAILABLE_FOR_BRANCH',
      'inventory.route_not_available_for_branch',
      {
        route_id,
        branch_id,
      },
    );
    return route;
  }

  async get_vehicle_for_branch_operation(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
    branch_id: number,
    options?: ActiveLookupOptions,
  ): Promise<Vehicle> {
    const vehicle = await this.get_vehicle_in_business(
      current_user,
      vehicle_id,
      options,
    );
    this.assert_entity_available_in_branch(
      vehicle,
      branch_id,
      'VEHICLE_NOT_AVAILABLE_FOR_BRANCH',
      'inventory.vehicle_not_available_for_branch',
      {
        vehicle_id,
        branch_id,
      },
    );
    return vehicle;
  }

  async get_vehicle_in_business(
    current_user: AuthenticatedUserContext,
    vehicle_id: number,
    options?: ActiveLookupOptions,
  ): Promise<Vehicle> {
    const vehicle = await this.vehicles_repository.find_by_id_in_business(
      vehicle_id,
      resolve_effective_business_id(current_user),
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

    this.assert_entity_is_active(
      vehicle,
      options?.require_active ?? false,
      'VEHICLE_INACTIVE',
      'inventory.vehicle_inactive',
      {
        vehicle_id,
      },
    );
    return vehicle;
  }

  async get_driver_user_for_dispatch_operation(
    current_user: AuthenticatedUserContext,
    user_id: number,
    branch_id?: number | null,
    options?: DriverLookupOptions,
  ): Promise<User> {
    const user = await this.users_repository.find_by_id_in_business(
      user_id,
      resolve_effective_business_id(current_user),
    );
    if (!user) {
      throw new DomainNotFoundException({
        code: 'USER_NOT_FOUND',
        messageKey: 'users.not_found',
        details: {
          user_id,
        },
      });
    }

    if (options?.require_active && user.status !== UserStatus.ACTIVE) {
      throw new DomainBadRequestException({
        code: 'DISPATCH_ORDER_DRIVER_INACTIVE',
        messageKey: 'inventory.dispatch_order_driver_inactive',
        details: {
          driver_user_id: user_id,
        },
      });
    }

    if (branch_id !== undefined && branch_id !== null) {
      this.assert_user_can_access_branch(
        user,
        branch_id,
        options?.allow_owner_or_global_scope ?? false,
      );
    }

    return user;
  }

  async get_warehouse_for_branch_operation(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
    branch_id: number,
    options?: ActiveLookupOptions,
  ): Promise<Warehouse> {
    const warehouse = await this.inventory_validation_service.get_warehouse_for_operation(
      current_user,
      warehouse_id,
      options,
    );
    const available_branch_ids = Array.from(
      new Set([
        warehouse.branch_id,
        ...(warehouse.branch_links
          ?.filter((branch_link) => branch_link.is_active)
          .map((branch_link) => branch_link.branch_id) ?? []),
      ]),
    );
    if (available_branch_ids.includes(branch_id)) {
      return warehouse;
    }

    throw new DomainBadRequestException({
      code: 'WAREHOUSE_NOT_ALLOWED_FOR_BRANCH',
      messageKey: 'inventory.warehouse_not_allowed_for_branch',
      details: {
        warehouse_id,
        branch_id,
      },
    });
  }

  assert_catalog_access(
    current_user: AuthenticatedUserContext,
    entity: BranchScopedCatalog,
  ): void {
    if (entity.is_global) {
      return;
    }

    this.branch_access_policy.assert_can_access_any_branch(
      current_user,
      this.get_active_branch_ids(entity),
    );
  }

  resolve_next_global_state(
    current_is_global: boolean,
    dto_is_global?: boolean,
    dto_assigned_branch_ids?: number[],
  ): boolean {
    if (dto_is_global !== undefined) {
      return dto_is_global;
    }

    if (dto_assigned_branch_ids !== undefined) {
      return false;
    }

    return current_is_global;
  }

  get_active_branch_ids(entity: BranchScopedCatalog): number[] {
    return Array.from(
      new Set(
        entity.branch_links
          ?.filter((branch_link) => branch_link.is_active)
          .map((branch_link) => branch_link.branch_id) ?? [],
      ),
    );
  }

  normalize_branch_ids(branch_ids?: number[] | null): number[] {
    return Array.from(
      new Set((branch_ids ?? []).filter((branch_id) => Number.isInteger(branch_id))),
    );
  }

  assert_non_global_requires_assignments(
    is_global: boolean,
    branch_ids: number[],
    code: string,
    messageKey: string,
  ): void {
    if (is_global || branch_ids.length > 0) {
      return;
    }

    throw new DomainBadRequestException({
      code,
      messageKey,
    });
  }

  private assert_entity_available_in_branch(
    entity: BranchScopedCatalog,
    branch_id: number,
    code: string,
    messageKey: string,
    details: Record<string, unknown>,
  ): void {
    if (entity.is_global || this.get_active_branch_ids(entity).includes(branch_id)) {
      return;
    }

    throw new DomainBadRequestException({
      code,
      messageKey,
      details,
    });
  }

  private assert_entity_is_active(
    entity: { id: number; is_active: boolean },
    require_active: boolean,
    code: string,
    messageKey: string,
    details: Record<string, unknown>,
  ): void {
    if (!require_active || entity.is_active) {
      return;
    }

    throw new DomainBadRequestException({
      code,
      messageKey,
      details,
    });
  }

  private assert_user_can_access_branch(
    user: User,
    branch_id: number,
    allow_owner_or_global_scope: boolean,
  ): void {
    if (
      user.is_platform_admin === true ||
      (allow_owner_or_global_scope && user.user_type === UserType.OWNER)
    ) {
      return;
    }

    const accessible_branch_ids =
      user.user_branch_access?.map((assignment) => assignment.branch_id) ?? [];
    if (!accessible_branch_ids.length || accessible_branch_ids.includes(branch_id)) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'DRIVER_USER_NOT_AVAILABLE_FOR_BRANCH',
      messageKey: 'inventory.driver_user_not_available_for_branch',
      details: {
        user_id: user.id,
        branch_id,
      },
    });
  }
}
