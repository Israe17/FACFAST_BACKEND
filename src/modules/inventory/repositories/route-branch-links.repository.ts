import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RouteBranchLink } from '../entities/route-branch-link.entity';

@Injectable()
export class RouteBranchLinksRepository {
  constructor(
    @InjectRepository(RouteBranchLink)
    private readonly route_branch_link_repository: Repository<RouteBranchLink>,
  ) {}

  create(payload: Partial<RouteBranchLink>): RouteBranchLink {
    return this.route_branch_link_repository.create(payload);
  }

  async save(route_branch_link: RouteBranchLink): Promise<RouteBranchLink> {
    return this.route_branch_link_repository.save(route_branch_link);
  }

  async find_by_route_and_branch(
    business_id: number,
    route_id: number,
    branch_id: number,
  ): Promise<RouteBranchLink | null> {
    return this.route_branch_link_repository.findOne({
      where: {
        business_id,
        route_id,
        branch_id,
      },
    });
  }

  async deactivate_all_by_route(
    business_id: number,
    route_id: number,
  ): Promise<void> {
    await this.route_branch_link_repository
      .createQueryBuilder()
      .update(RouteBranchLink)
      .set({ is_active: false })
      .where('business_id = :business_id', { business_id })
      .andWhere('route_id = :route_id', { route_id })
      .execute();
  }
}
