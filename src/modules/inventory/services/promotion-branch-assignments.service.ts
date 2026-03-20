import { Injectable } from '@nestjs/common';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { CreatePromotionBranchAssignmentDto } from '../dto/create-promotion-branch-assignment.dto';
import { UpdatePromotionBranchAssignmentDto } from '../dto/update-promotion-branch-assignment.dto';
import { PromotionBranchAssignment } from '../entities/promotion-branch-assignment.entity';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class PromotionBranchAssignmentsService {
  constructor(
    private readonly promotions_repository: PromotionsRepository,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
  ) {}

  async get_promotion_branch_assignments(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_promotion_entity(business_id, promotion_id);
    const branch_scope_ids = resolve_effective_branch_scope_ids(current_user);
    const assignments =
      await this.promotion_branch_assignments_repository.find_all_by_promotion_in_business(
        business_id,
        promotion_id,
        branch_scope_ids,
      );

    return {
      promotion_id,
      assignments: assignments.map((assignment) =>
        this.serialize_assignment(assignment),
      ),
    };
  }

  async get_branch_promotions(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.get_branch_entity(current_user, business_id, branch_id);
    const assignments =
      await this.promotion_branch_assignments_repository.find_all_by_branch_in_business(
        business_id,
        branch_id,
      );

    return {
      branch_id,
      assignments: assignments.map((assignment) =>
        this.serialize_assignment(assignment),
      ),
    };
  }

  async create_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    dto: CreatePromotionBranchAssignmentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const promotion = await this.get_promotion_entity(
      business_id,
      promotion_id,
    );
    const branch = await this.get_branch_entity(
      current_user,
      business_id,
      dto.branch_id,
    );

    const existing_assignment =
      await this.promotion_branch_assignments_repository.find_by_branch_and_promotion_in_business(
        business_id,
        branch.id,
        promotion.id,
      );
    if (existing_assignment) {
      throw new DomainConflictException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_DUPLICATE',
        messageKey: 'inventory.branch_promotion_assignment_duplicate',
        details: {
          branch_id: branch.id,
          promotion_id: promotion.id,
        },
      });
    }

    const next_is_active = dto.is_active ?? true;
    this.assert_promotion_active(promotion, next_is_active);

    const assignment = this.promotion_branch_assignments_repository.create({
      business_id,
      promotion_id: promotion.id,
      branch_id: branch.id,
      is_active: next_is_active,
      notes: this.normalize_optional_string(dto.notes),
    });

    const saved_assignment =
      await this.promotion_branch_assignments_repository.save(assignment);
    const hydrated_assignment =
      await this.promotion_branch_assignments_repository.find_by_id_in_business(
        saved_assignment.id,
        business_id,
      );
    if (!hydrated_assignment) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_promotion_assignment_not_found',
        details: {
          assignment_id: saved_assignment.id,
        },
      });
    }

    return this.serialize_assignment(hydrated_assignment);
  }

  async update_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    assignment_id: number,
    dto: UpdatePromotionBranchAssignmentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const assignment = await this.get_assignment_entity(
      business_id,
      promotion_id,
      assignment_id,
    );
    await this.get_branch_entity(
      current_user,
      business_id,
      assignment.branch_id,
    );

    const next_is_active = dto.is_active ?? assignment.is_active;
    this.assert_promotion_active(assignment.promotion, next_is_active);

    if (dto.is_active !== undefined) {
      assignment.is_active = dto.is_active;
    }
    if (dto.notes !== undefined) {
      assignment.notes = this.normalize_optional_string(dto.notes);
    }

    const saved_assignment =
      await this.promotion_branch_assignments_repository.save(assignment);
    const hydrated_assignment =
      await this.promotion_branch_assignments_repository.find_by_id_in_business(
        saved_assignment.id,
        business_id,
      );
    if (!hydrated_assignment) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_promotion_assignment_not_found',
        details: {
          assignment_id,
        },
      });
    }

    return this.serialize_assignment(hydrated_assignment);
  }

  async delete_promotion_branch_assignment(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    assignment_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const assignment = await this.get_assignment_entity(
      business_id,
      promotion_id,
      assignment_id,
    );
    await this.get_branch_entity(
      current_user,
      business_id,
      assignment.branch_id,
    );
    await this.promotion_branch_assignments_repository.remove(assignment);
    return {
      id: assignment_id,
      deleted: true,
    };
  }

  private async get_promotion_entity(
    business_id: number,
    promotion_id: number,
  ) {
    const promotion = await this.promotions_repository.find_by_id_in_business(
      promotion_id,
      business_id,
    );
    if (!promotion) {
      throw new DomainNotFoundException({
        code: 'PROMOTION_NOT_FOUND',
        messageKey: 'inventory.promotion_not_found',
        details: {
          promotion_id,
        },
      });
    }

    return promotion;
  }

  private async get_branch_entity(
    current_user: AuthenticatedUserContext,
    business_id: number,
    branch_id: number,
  ) {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      business_id,
    );
    if (!branch) {
      throw new DomainNotFoundException({
        code: 'BRANCH_NOT_FOUND',
        messageKey: 'branches.not_found',
        details: {
          branch_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(current_user, branch.id);
    return branch;
  }

  private async get_assignment_entity(
    business_id: number,
    promotion_id: number,
    assignment_id: number,
  ): Promise<PromotionBranchAssignment> {
    const assignment =
      await this.promotion_branch_assignments_repository.find_by_id_in_business(
        assignment_id,
        business_id,
      );
    if (!assignment || assignment.promotion_id !== promotion_id) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_promotion_assignment_not_found',
        details: {
          assignment_id,
          promotion_id,
        },
      });
    }

    return assignment;
  }

  private assert_promotion_active(
    promotion: { id: number; is_active: boolean } | null | undefined,
    required: boolean,
  ): void {
    if (!required || !promotion || promotion.is_active) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'PROMOTION_INACTIVE',
      messageKey: 'inventory.promotion_inactive',
      details: {
        promotion_id: promotion.id,
      },
    });
  }

  private serialize_assignment(assignment: PromotionBranchAssignment) {
    return {
      id: assignment.id,
      business_id: assignment.business_id,
      branch: assignment.branch
        ? {
            id: assignment.branch.id,
            code: assignment.branch.code,
            name: assignment.branch.name,
            business_name: assignment.branch.business_name,
            branch_number: assignment.branch.branch_number,
            is_active: assignment.branch.is_active,
          }
        : { id: assignment.branch_id },
      promotion: assignment.promotion
        ? {
            id: assignment.promotion.id,
            code: assignment.promotion.code,
            name: assignment.promotion.name,
            type: assignment.promotion.type,
            valid_from: assignment.promotion.valid_from,
            valid_to: assignment.promotion.valid_to,
            is_active: assignment.promotion.is_active,
          }
        : { id: assignment.promotion_id },
      is_active: assignment.is_active,
      notes: assignment.notes,
      lifecycle: {
        can_delete: true,
        can_deactivate: assignment.is_active,
        can_reactivate: !assignment.is_active,
        reasons: [],
      },
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    };
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
