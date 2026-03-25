import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PricingValidationService } from '../services/pricing-validation.service';

export type DeletePromotionBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
  promotion_id?: number;
};

export type DeletePromotionBranchAssignmentResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeletePromotionBranchAssignmentUseCase
  implements
    CommandUseCase<
      DeletePromotionBranchAssignmentCommand,
      DeletePromotionBranchAssignmentResult
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
  ) {}

  async execute({
    current_user,
    assignment_id,
    promotion_id,
  }: DeletePromotionBranchAssignmentCommand): Promise<DeletePromotionBranchAssignmentResult> {
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
    await this.promotion_branch_assignments_repository.remove(assignment);

    return {
      id: assignment_id,
      deleted: true,
    };
  }
}
