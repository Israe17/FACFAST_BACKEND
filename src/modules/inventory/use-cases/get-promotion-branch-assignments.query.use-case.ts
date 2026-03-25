import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { PromotionBranchAssignmentsView } from '../contracts/promotion-branch-assignments.view';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PromotionBranchAssignmentSerializer } from '../serializers/promotion-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetPromotionBranchAssignmentsQuery = {
  current_user: AuthenticatedUserContext;
  promotion_id: number;
};

@Injectable()
export class GetPromotionBranchAssignmentsQueryUseCase
  implements
    QueryUseCase<
      GetPromotionBranchAssignmentsQuery,
      PromotionBranchAssignmentsView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
    private readonly promotion_branch_assignment_serializer: PromotionBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    promotion_id,
  }: GetPromotionBranchAssignmentsQuery): Promise<PromotionBranchAssignmentsView> {
    const business_id = resolve_effective_business_id(current_user);
    await this.pricing_validation_service.get_promotion_in_business(
      business_id,
      promotion_id,
    );

    const assignments =
      await this.promotion_branch_assignments_repository.find_all_by_promotion_in_business(
        business_id,
        promotion_id,
        resolve_effective_branch_scope_ids(current_user),
      );

    return {
      promotion_id,
      assignments: assignments.map((assignment) =>
        this.promotion_branch_assignment_serializer.serialize(assignment),
      ),
    };
  }
}
