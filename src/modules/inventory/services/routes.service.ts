import { Injectable } from '@nestjs/common';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateRouteDto } from '../dto/create-route.dto';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { Route } from '../entities/route.entity';
import { RoutesRepository } from '../repositories/routes.repository';

@Injectable()
export class RoutesService {
  constructor(
    private readonly routes_repository: RoutesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_routes(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const routes =
      await this.routes_repository.find_all_by_business(business_id);
    return routes.map((route) => this.serialize_route(route));
  }

  async create_route(
    current_user: AuthenticatedUserContext,
    dto: CreateRouteDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
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

    return this.serialize_route(
      await this.routes_repository.save(
        this.routes_repository.create({
          business_id,
          code: dto.code?.trim() ?? null,
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
      ),
    );
  }

  async get_route(current_user: AuthenticatedUserContext, route_id: number) {
    return this.serialize_route(
      await this.get_route_entity(
        resolve_effective_business_id(current_user),
        route_id,
      ),
    );
  }

  async update_route(
    current_user: AuthenticatedUserContext,
    route_id: number,
    dto: UpdateRouteDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const route = await this.get_route_entity(business_id, route_id);
    const next_name = dto.name?.trim() ?? route.name;

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

    if (dto.code) {
      this.entity_code_service.validate_code('RT', dto.code.trim());
      route.code = dto.code.trim();
    }
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
      route.estimated_cost = dto.estimated_cost;
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

    return this.serialize_route(await this.routes_repository.save(route));
  }

  async delete_route(current_user: AuthenticatedUserContext, route_id: number) {
    const business_id = resolve_effective_business_id(current_user);
    const route = await this.get_route_entity(business_id, route_id);

    await this.routes_repository.remove(route);
    return { id: route_id };
  }

  private async get_route_entity(
    business_id: number,
    route_id: number,
  ): Promise<Route> {
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

    return route;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_route(route: Route) {
    return {
      id: route.id,
      code: route.code,
      business_id: route.business_id,
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
