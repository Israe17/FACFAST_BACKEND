import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { WarehouseLocation } from '../entities/warehouse-location.entity';

@Injectable()
export class WarehouseLocationsRepository {
  constructor(
    @InjectRepository(WarehouseLocation)
    private readonly warehouse_location_repository: Repository<WarehouseLocation>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<WarehouseLocation>): WarehouseLocation {
    return this.warehouse_location_repository.create(payload);
  }

  async save(location: WarehouseLocation): Promise<WarehouseLocation> {
    const saved_location =
      await this.warehouse_location_repository.save(location);
    return this.entity_code_service.ensure_code(
      this.warehouse_location_repository,
      saved_location,
      'WL',
    );
  }

  async find_all_by_warehouse_in_business(
    warehouse_id: number,
    business_id: number,
  ): Promise<WarehouseLocation[]> {
    return this.warehouse_location_repository.find({
      where: {
        warehouse_id,
        business_id,
      },
      order: {
        name: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<WarehouseLocation | null> {
    return this.warehouse_location_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: {
        warehouse: true,
      },
    });
  }

  async exists_name_in_warehouse(
    warehouse_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.warehouse_location_repository
      .createQueryBuilder('warehouse_location')
      .where('warehouse_location.warehouse_id = :warehouse_id', {
        warehouse_id,
      })
      .andWhere('LOWER(warehouse_location.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('warehouse_location.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
