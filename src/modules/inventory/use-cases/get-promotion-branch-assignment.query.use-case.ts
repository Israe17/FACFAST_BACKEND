import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionBranchAssignmentView } from '../contracts/promotion-branch-assignment.view';
import { PromotionBranchAssignmentSerializer } from '../serializers/promotion-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetPromotionBranchAssignmentQuery = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
};

@Injectable()
export class GetPromotionBranchAssignmentQueryUseCase
  implements
    QueryUseCase<
      GetPromotionBranchAssignmentQuery,
      PromotionBranchAssignmentView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_branch_assignment_serializer: PromotionBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    assignment_id,
  }: GetPromotionBranchAssignmentQuery): Promise<PromotionBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    const assignment =
      await this.pricing_validation_service.get_promotion_branch_assignment_in_business(
        business_id,
        assignment_id,
      );
    await this.pricing_validation_service.get_branch_for_pricing_access(
      current_user,
      business_id,
      assignment.branch_id,
    );

    return this.promotion_branch_assignment_serializer.serialize(assignment);
  }
}
