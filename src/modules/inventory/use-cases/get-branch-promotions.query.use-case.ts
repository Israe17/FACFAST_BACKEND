import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { BranchPromotionsView } from '../contracts/branch-promotions.view';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PromotionBranchAssignmentSerializer } from '../serializers/promotion-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetBranchPromotionsQuery = {
  current_user: AuthenticatedUserContext;
  branch_id: number;
};

@Injectable()
export class GetBranchPromotionsQueryUseCase
  implements QueryUseCase<GetBranchPromotionsQuery, BranchPromotionsView>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
    private readonly promotion_branch_assignment_serializer: PromotionBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    branch_id,
  }: GetBranchPromotionsQuery): Promise<BranchPromotionsView> {
    const business_id = resolve_effective_business_id(current_user);
    await this.pricing_validation_service.get_branch_for_pricing_access(
      current_user,
      business_id,
      branch_id,
    );

    const assignments =
      await this.promotion_branch_assignments_repository.find_all_by_branch_in_business(
        business_id,
        branch_id,
      );

    return {
      branch_id,
      assignments: assignments.map((assignment) =>
        this.promotion_branch_assignment_serializer.serialize(assignment),
      ),
    };
  }
}
