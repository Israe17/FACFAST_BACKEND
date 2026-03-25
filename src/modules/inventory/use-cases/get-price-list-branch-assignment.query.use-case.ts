import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListBranchAssignmentView } from '../contracts/price-list-branch-assignment.view';
import { PriceListBranchAssignmentSerializer } from '../serializers/price-list-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetPriceListBranchAssignmentQuery = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
};

@Injectable()
export class GetPriceListBranchAssignmentQueryUseCase
  implements
    QueryUseCase<
      GetPriceListBranchAssignmentQuery,
      PriceListBranchAssignmentView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_branch_assignment_serializer: PriceListBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    assignment_id,
  }: GetPriceListBranchAssignmentQuery): Promise<PriceListBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    const assignment =
      await this.pricing_validation_service.get_price_list_branch_assignment_in_business(
        business_id,
        assignment_id,
      );
    await this.pricing_validation_service.get_branch_for_pricing_access(
      current_user,
      business_id,
      assignment.branch_id,
    );

    return this.price_list_branch_assignment_serializer.serialize(assignment);
  }
}
