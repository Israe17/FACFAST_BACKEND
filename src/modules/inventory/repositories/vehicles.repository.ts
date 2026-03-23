import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Vehicle } from '../entities/vehicle.entity';

@Injectable()
export class VehiclesRepository {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicle_repository: Repository<Vehicle>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Vehicle>): Vehicle {
    return this.vehicle_repository.create(payload);
  }

  async save(vehicle: Vehicle): Promise<Vehicle> {
    const saved_vehicle = await this.vehicle_repository.save(vehicle);
    return this.entity_code_service.ensure_code(
      this.vehicle_repository,
      saved_vehicle,
      'VH',
    );
  }

  async find_all_by_business(business_id: number): Promise<Vehicle[]> {
    return this.vehicle_repository.find({
      where: { business_id },
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Vehicle | null> {
    return this.vehicle_repository.findOne({
      where: { id, business_id },
    });
  }

  async remove(vehicle: Vehicle): Promise<void> {
    await this.vehicle_repository.remove(vehicle);
  }

  async exists_plate_in_business(
    business_id: number,
    plate_number: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.vehicle_repository
      .createQueryBuilder('vehicle')
      .where('vehicle.business_id = :business_id', { business_id })
      .andWhere('LOWER(vehicle.plate_number) = LOWER(:plate_number)', {
        plate_number,
      });

    if (exclude_id !== undefined) {
      query.andWhere('vehicle.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
