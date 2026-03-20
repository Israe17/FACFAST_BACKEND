import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PromotionBranchAssignment } from '../entities/promotion-branch-assignment.entity';

@Injectable()
export class PromotionBranchAssignmentsRepository {
  constructor(
    @InjectRepository(PromotionBranchAssignment)
    private readonly assignment_repository: Repository<PromotionBranchAssignment>,
  ) {}

  create(
    payload: Partial<PromotionBranchAssignment>,
  ): PromotionBranchAssignment {
    return this.assignment_repository.create(payload);
  }

  async save(
    assignment: PromotionBranchAssignment,
  ): Promise<PromotionBranchAssignment> {
    return this.assignment_repository.save(assignment);
  }

  async remove(assignment: PromotionBranchAssignment): Promise<void> {
    await this.assignment_repository.remove(assignment);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<PromotionBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: { id, business_id },
      relations: {
        branch: true,
        promotion: true,
      },
    });
  }

  async find_by_branch_and_promotion_in_business(
    business_id: number,
    branch_id: number,
    promotion_id: number,
  ): Promise<PromotionBranchAssignment | null> {
    return this.assignment_repository.findOne({
      where: {
        business_id,
        branch_id,
        promotion_id,
      },
      relations: {
        branch: true,
        promotion: true,
      },
    });
  }

  async find_all_by_promotion_in_business(
    business_id: number,
    promotion_id: number,
    branch_ids?: number[],
  ): Promise<PromotionBranchAssignment[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.assignment_repository.find({
      where: {
        business_id,
        promotion_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: {
        branch: true,
        promotion: true,
      },
      order: {
        is_active: 'DESC',
        branch_id: 'ASC',
      },
    });
  }

  async find_all_by_branch_in_business(
    business_id: number,
    branch_id: number,
  ): Promise<PromotionBranchAssignment[]> {
    return this.assignment_repository.find({
      where: {
        business_id,
        branch_id,
      },
      relations: {
        branch: true,
        promotion: true,
      },
      order: {
        is_active: 'DESC',
        created_at: 'ASC',
      },
    });
  }
}
