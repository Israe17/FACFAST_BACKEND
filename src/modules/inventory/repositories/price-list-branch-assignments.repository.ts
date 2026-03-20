import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PriceListBranchAssignment } from '../entities/price-list-branch-assignment.entity';

@Injectable()
export class PriceListBranchAssignmentsRepository {
  constructor(
    @InjectRepository(PriceListBranchAssignment)
    private readonly assignment_repository: Repository<PriceListBranchAssignment>,
  ) {}

  create(
    payload: Partial<PriceListBranchAssignment>,
  ): PriceListBranchAssignment {
    return this.assignment_repository.create(payload);
  }

  async save(
    assignment: PriceListBranchAssignment,
  ): Promise<PriceListBranchAssignment> {
    return this.assignment_repository.save(assignment);
  }

  async remove(assignment: PriceListBranchAssignment): Promise<void> {
    await this.assignment_repository.remove(assignment);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<PriceListBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: { id, business_id },
      relations: {
        branch: true,
        price_list: true,
      },
    });
  }

  async find_by_branch_and_price_list_in_business(
    business_id: number,
    branch_id: number,
    price_list_id: number,
  ): Promise<PriceListBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: {
        business_id,
        branch_id,
        price_list_id,
      },
      relations: {
        branch: true,
        price_list: true,
      },
    });
  }

  async find_all_by_price_list_in_business(
    business_id: number,
    price_list_id: number,
    branch_ids?: number[],
  ): Promise<PriceListBranchAssignment[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.assignment_repository.find({
      where: {
        business_id,
        price_list_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: {
        branch: true,
        price_list: true,
      },
      order: {
        is_active: 'DESC',
        is_default: 'DESC',
        branch_id: 'ASC',
      },
    });
  }

  async find_all_by_branch_in_business(
    business_id: number,
    branch_id: number,
  ): Promise<PriceListBranchAssignment[]> {
    return this.assignment_repository.find({
      where: {
        business_id,
        branch_id,
      },
      relations: {
        branch: true,
        price_list: true,
      },
      order: {
        is_active: 'DESC',
        is_default: 'DESC',
        created_at: 'ASC',
      },
    });
  }

  async unset_default_for_branch(
    business_id: number,
    branch_id: number,
    exclude_id?: number,
  ): Promise<void> {
    const query = this.assignment_repository
      .createQueryBuilder()
      .update(PriceListBranchAssignment)
      .set({ is_default: false })
      .where('business_id = :business_id', { business_id })
      .andWhere('branch_id = :branch_id', { branch_id });

    if (exclude_id !== undefined) {
      query.andWhere('id != :exclude_id', { exclude_id });
    }

    await query.execute();
  }

  async find_active_by_branch_and_price_list_in_business(
    business_id: number,
    branch_id: number,
    price_list_id: number,
  ): Promise<PriceListBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: {
        business_id,
        branch_id,
        price_list_id,
        is_active: true,
      },
      relations: {
        branch: true,
        price_list: true,
      },
    });
  }
}
