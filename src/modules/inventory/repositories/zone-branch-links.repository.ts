import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ZoneBranchLink } from '../entities/zone-branch-link.entity';

@Injectable()
export class ZoneBranchLinksRepository {
  constructor(
    @InjectRepository(ZoneBranchLink)
    private readonly zone_branch_link_repository: Repository<ZoneBranchLink>,
  ) {}

  create(payload: Partial<ZoneBranchLink>): ZoneBranchLink {
    return this.zone_branch_link_repository.create(payload);
  }

  async save(zone_branch_link: ZoneBranchLink): Promise<ZoneBranchLink> {
    return this.zone_branch_link_repository.save(zone_branch_link);
  }

  async find_by_zone_and_branch(
    business_id: number,
    zone_id: number,
    branch_id: number,
  ): Promise<ZoneBranchLink | null> {
    return this.zone_branch_link_repository.findOne({
      where: {
        business_id,
        zone_id,
        branch_id,
      },
    });
  }

  async deactivate_all_by_zone(
    business_id: number,
    zone_id: number,
  ): Promise<void> {
    await this.zone_branch_link_repository
      .createQueryBuilder()
      .update(ZoneBranchLink)
      .set({ is_active: false })
      .where('business_id = :business_id', { business_id })
      .andWhere('zone_id = :zone_id', { zone_id })
      .execute();
  }
}
