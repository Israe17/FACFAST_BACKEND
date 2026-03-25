import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { VehicleBranchLink } from '../entities/vehicle-branch-link.entity';

@Injectable()
export class VehicleBranchLinksRepository {
  constructor(
    @InjectRepository(VehicleBranchLink)
    private readonly vehicle_branch_link_repository: Repository<VehicleBranchLink>,
  ) {}

  create(payload: Partial<VehicleBranchLink>): VehicleBranchLink {
    return this.vehicle_branch_link_repository.create(payload);
  }

  async save(
    vehicle_branch_link: VehicleBranchLink,
  ): Promise<VehicleBranchLink> {
    return this.vehicle_branch_link_repository.save(vehicle_branch_link);
  }

  async find_by_vehicle_and_branch(
    business_id: number,
    vehicle_id: number,
    branch_id: number,
  ): Promise<VehicleBranchLink | null> {
    return this.vehicle_branch_link_repository.findOne({
      where: {
        business_id,
        vehicle_id,
        branch_id,
      },
    });
  }

  async deactivate_all_by_vehicle(
    business_id: number,
    vehicle_id: number,
  ): Promise<void> {
    await this.vehicle_branch_link_repository
      .createQueryBuilder()
      .update(VehicleBranchLink)
      .set({ is_active: false })
      .where('business_id = :business_id', { business_id })
      .andWhere('vehicle_id = :vehicle_id', { vehicle_id })
      .execute();
  }
}
