import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { WarehouseLocationView } from '../contracts/warehouse-location.view';
import { WarehouseView } from '../contracts/warehouse.view';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { CreateWarehouseLocationUseCase } from '../use-cases/create-warehouse-location.use-case';
import { CreateWarehouseUseCase } from '../use-cases/create-warehouse.use-case';
import { DeactivateWarehouseUseCase } from '../use-cases/deactivate-warehouse.use-case';
import { GetWarehouseLocationQueryUseCase } from '../use-cases/get-warehouse-location.query.use-case';
import { GetWarehouseLocationsQueryUseCase } from '../use-cases/get-warehouse-locations.query.use-case';
import { GetWarehouseQueryUseCase } from '../use-cases/get-warehouse.query.use-case';
import { GetWarehousesListQueryUseCase } from '../use-cases/get-warehouses-list.query.use-case';
import { UpdateWarehouseLocationUseCase } from '../use-cases/update-warehouse-location.use-case';
import { UpdateWarehouseUseCase } from '../use-cases/update-warehouse.use-case';

@Injectable()
export class WarehousesService {
  constructor(
    private readonly get_warehouses_list_query_use_case: GetWarehousesListQueryUseCase,
    private readonly get_warehouse_query_use_case: GetWarehouseQueryUseCase,
    private readonly create_warehouse_use_case: CreateWarehouseUseCase,
    private readonly update_warehouse_use_case: UpdateWarehouseUseCase,
    private readonly deactivate_warehouse_use_case: DeactivateWarehouseUseCase,
    private readonly get_warehouse_locations_query_use_case: GetWarehouseLocationsQueryUseCase,
    private readonly get_warehouse_location_query_use_case: GetWarehouseLocationQueryUseCase,
    private readonly create_warehouse_location_use_case: CreateWarehouseLocationUseCase,
    private readonly update_warehouse_location_use_case: UpdateWarehouseLocationUseCase,
  ) {}

  async get_warehouses(
    current_user: AuthenticatedUserContext,
  ): Promise<WarehouseView[]> {
    return this.get_warehouses_list_query_use_case.execute({ current_user });
  }

  async create_warehouse(
    current_user: AuthenticatedUserContext,
    dto: CreateWarehouseDto,
  ): Promise<WarehouseView> {
    return this.create_warehouse_use_case.execute({ current_user, dto });
  }

  async get_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<WarehouseView> {
    return this.get_warehouse_query_use_case.execute({
      current_user,
      warehouse_id,
    });
  }

  async update_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
    dto: UpdateWarehouseDto,
  ): Promise<WarehouseView> {
    return this.update_warehouse_use_case.execute({
      current_user,
      warehouse_id,
      dto,
    });
  }

  async get_locations(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<WarehouseLocationView[]> {
    return this.get_warehouse_locations_query_use_case.execute({
      current_user,
      warehouse_id,
    });
  }

  async create_location(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
    dto: CreateWarehouseLocationDto,
  ): Promise<WarehouseLocationView> {
    return this.create_warehouse_location_use_case.execute({
      current_user,
      warehouse_id,
      dto,
    });
  }

  async get_location(
    current_user: AuthenticatedUserContext,
    location_id: number,
  ): Promise<WarehouseLocationView> {
    return this.get_warehouse_location_query_use_case.execute({
      current_user,
      location_id,
    });
  }

  async update_location(
    current_user: AuthenticatedUserContext,
    location_id: number,
    dto: UpdateWarehouseLocationDto,
  ): Promise<WarehouseLocationView> {
    return this.update_warehouse_location_use_case.execute({
      current_user,
      location_id,
      dto,
    });
  }

  async deactivate_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse_id: number,
  ): Promise<WarehouseView> {
    return this.deactivate_warehouse_use_case.execute({
      current_user,
      warehouse_id,
    });
  }
}
