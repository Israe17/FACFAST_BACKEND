import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionBranchAssignmentView } from '../contracts/promotion-branch-assignment.view';
import { UpdatePromotionBranchAssignmentDto } from '../dto/update-promotion-branch-assignment.dto';
import { PromotionBranchAssignmentPolicy } from '../policies/promotion-branch-assignment.policy';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PromotionBranchAssignmentSerializer } from '../serializers/promotion-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type UpdatePromotionBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
  dto: UpdatePromotionBranchAssignmentDto;
  promotion_id?: number;
};

@Injectable()
export class UpdatePromotionBranchAssignmentUseCase
  implements
    CommandUseCase<
      UpdatePromotionBranchAssignmentCommand,
      PromotionBranchAssignmentView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
    private readonly promotion_branch_assignment_policy: PromotionBranchAssignmentPolicy,
    private readonly promotion_branch_assignment_serializer: PromotionBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    assignment_id,
    dto,
    promotion_id,
  }: UpdatePromotionBranchAssignmentCommand): Promise<PromotionBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    const assignment =
      await this.pricing_validation_service.get_promotion_branch_assignment_in_business(
        business_id,
        assignment_id,
      );

    if (promotion_id !== undefined && assignment.promotion_id !== promotion_id) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_promotion_assignment_not_found',
        details: {
          assignment_id,
          promotion_id,
        },
      });
    }

    await this.pricing_validation_service.get_branch_for_pricing_access(
      current_user,
      business_id,
      assignment.branch_id,
    );
    this.promotion_branch_assignment_policy.assert_promotion_active(
      assignment.promotion,
      dto.is_active ?? assignment.is_active,
    );

    if (dto.is_active !== undefined) {
      assignment.is_active = dto.is_active;
    }
    if (dto.notes !== undefined) {
      assignment.notes =
        this.promotion_branch_assignment_policy.normalize_optional_string(
          dto.notes,
        );
    }

    const saved_assignment =
      await this.promotion_branch_assignments_repository.save(assignment);
    const hydrated_assignment =
      await this.pricing_validation_service.get_promotion_branch_assignment_in_business(
        business_id,
        saved_assignment.id,
      );

    return this.promotion_branch_assignment_serializer.serialize(
      hydrated_assignment,
    );
  }
}
