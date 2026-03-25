import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchPromotionsView } from '../contracts/branch-promotions.view';
import { PromotionBranchAssignmentView } from '../contracts/promotion-branch-assignment.view';
import { PromotionBranchAssignmentsView } from '../contracts/promotion-branch-assignments.view';
import { CreatePromotionBranchAssignmentDto } from '../dto/create-promotion-branch-assignment.dto';
import { UpdatePromotionBranchAssignmentDto } from '../dto/update-promotion-branch-assignment.dto';
import { CreatePromotionBranchAssignmentUseCase } from '../use-cases/create-promotion-branch-assignment.use-case';
import {
  DeletePromotionBranchAssignmentResult,
  DeletePromotionBranchAssignmentUseCase,
} from '../use-cases/delete-promotion-branch-assignment.use-case';
import { GetBranchPromotionsQueryUseCase } from '../use-cases/get-branch-promotions.query.use-case';
import { GetPromotionBranchAssignmentQueryUseCase } from '../use-cases/get-promotion-branch-assignment.query.use-case';
import { GetPromotionBranchAssignmentsQueryUseCase } from '../use-cases/get-promotion-branch-assignments.query.use-case';
import { UpdatePromotionBranchAssignmentUseCase } from '../use-cases/update-promotion-branch-assignment.use-case';

@Injectable()
export class PromotionBranchAssignmentsService {
  constructor(
    private readonly get_promotion_branch_assignments_query_use_case: GetPromotionBranchAssignmentsQueryUseCase,
    private readonly get_branch_promotions_query_use_case: GetBranchPromotionsQueryUseCase,
    private readonly create_promotion_branch_assignment_use_case: CreatePromotionBranchAssignmentUseCase,
    private readonly get_promotion_branch_assignment_query_use_case: GetPromotionBranchAssignmentQueryUseCase,
    private readonly update_promotion_branch_assignment_use_case: UpdatePromotionBranchAssignmentUseCase,
    private readonly delete_promotion_branch_assignment_use_case: DeletePromotionBranchAssignmentUseCase,
  ) {}

  async get_promotion_branch_assignments(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ): Promise<PromotionBranchAssignmentsView> {
    return this.get_promotion_branch_assignments_query_use_case.execute({
      current_user,
      promotion_id,
    });
  }

  async get_branch_promotions(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): Promise<BranchPromotionsView> {
    return this.get_branch_promotions_query_use_case.execute({
      current_user,
      branch_id,
    });
  }

  async create_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    dto: CreatePromotionBranchAssignmentDto,
  ): Promise<PromotionBranchAssignmentView> {
    return this.create_promotion_branch_assignment_use_case.execute({
      current_user,
      promotion_id,
      dto,
    });
  }

  async get_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
  ): Promise<PromotionBranchAssignmentView> {
    return this.get_promotion_branch_assignment_query_use_case.execute({
      current_user,
      assignment_id,
    });
  }

  async update_promotion_branch_assignment_by_id(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
    dto: UpdatePromotionBranchAssignmentDto,
  ): Promise<PromotionBranchAssignmentView> {
    return this.update_promotion_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      dto,
    });
  }

  async update_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    assignment_id: number,
    dto: UpdatePromotionBranchAssignmentDto,
  ): Promise<PromotionBranchAssignmentView> {
    return this.update_promotion_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      dto,
      promotion_id,
    });
  }

  async delete_promotion_branch_assignment_by_id(
    current_user: AuthenticatedUserContext,
    assignment_id: number,
  ): Promise<DeletePromotionBranchAssignmentResult> {
    return this.delete_promotion_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
    });
  }

  async delete_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    assignment_id: number,
  ): Promise<DeletePromotionBranchAssignmentResult> {
    return this.delete_promotion_branch_assignment_use_case.execute({
      current_user,
      assignment_id,
      promotion_id,
    });
  }
}
