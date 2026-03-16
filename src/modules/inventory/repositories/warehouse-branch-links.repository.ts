import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WarehouseBranchLink } from '../entities/warehouse-branch-link.entity';

@Injectable()
export class WarehouseBranchLinksRepository {
  constructor(
    @InjectRepository(WarehouseBranchLink)
    private readonly warehouse_branch_link_repository: Repository<WarehouseBranchLink>,
  ) {}

  create(payload: Partial<WarehouseBranchLink>): WarehouseBranchLink {
    return this.warehouse_branch_link_repository.create(payload);
  }

  async save(
    warehouse_branch_link: WarehouseBranchLink,
  ): Promise<WarehouseBranchLink> {
    return this.warehouse_branch_link_repository.save(warehouse_branch_link);
  }

  async find_by_warehouse_and_branch(
    business_id: number,
    warehouse_id: number,
    branch_id: number,
  ): Promise<WarehouseBranchLink | null> {
    return this.warehouse_branch_link_repository.findOne({
      where: {
        business_id,
        warehouse_id,
        branch_id,
      },
    });
  }

  async deactivate_other_links(
    business_id: number,
    warehouse_id: number,
    keep_branch_id: number,
  ): Promise<void> {
    await this.warehouse_branch_link_repository
      .createQueryBuilder()
      .update(WarehouseBranchLink)
      .set({
        is_primary_for_sales: false,
        is_primary_for_purchases: false,
      })
      .where('business_id = :business_id', { business_id })
      .andWhere('warehouse_id = :warehouse_id', { warehouse_id })
      .andWhere('branch_id != :keep_branch_id', { keep_branch_id })
      .execute();
  }

  async find_active_by_warehouse(
    business_id: number,
    warehouse_id: number,
  ): Promise<WarehouseBranchLink[]> {
    return this.warehouse_branch_link_repository.find({
      where: {
        business_id,
        warehouse_id,
        is_active: true,
      },
      order: {
        priority: 'ASC',
        id: 'ASC',
      },
    });
  }

  async exists_active_by_warehouse_and_branch(
    business_id: number,
    warehouse_id: number,
    branch_id: number,
  ): Promise<boolean> {
    return (
      (await this.warehouse_branch_link_repository.count({
        where: {
          business_id,
          warehouse_id,
          branch_id,
          is_active: true,
        },
      })) > 0
    );
  }
}
