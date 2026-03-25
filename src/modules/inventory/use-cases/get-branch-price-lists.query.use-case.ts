import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { BranchPriceListsView } from '../contracts/branch-price-lists.view';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PriceListBranchAssignmentSerializer } from '../serializers/price-list-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetBranchPriceListsQuery = {
  current_user: AuthenticatedUserContext;
  branch_id: number;
};

@Injectable()
export class GetBranchPriceListsQueryUseCase
  implements QueryUseCase<GetBranchPriceListsQuery, BranchPriceListsView>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_branch_assignments_repository: PriceListBranchAssignmentsRepository,
    private readonly price_list_branch_assignment_serializer: PriceListBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    branch_id,
  }: GetBranchPriceListsQuery): Promise<BranchPriceListsView> {
    const business_id = resolve_effective_business_id(current_user);
    await this.pricing_validation_service.get_branch_for_pricing_access(
      current_user,
      business_id,
      branch_id,
    );

    const assignments =
      await this.price_list_branch_assignments_repository.find_all_by_branch_in_business(
        business_id,
        branch_id,
      );
    const default_assignment =
      assignments.find((assignment) => assignment.is_default) ?? null;

    return {
      branch_id,
      default_price_list_id: default_assignment?.price_list_id ?? null,
      assignments: assignments.map((assignment) =>
        this.price_list_branch_assignment_serializer.serialize(assignment),
      ),
    };
  }
}
