import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { PriceListBranchAssignmentsView } from '../contracts/price-list-branch-assignments.view';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PriceListBranchAssignmentSerializer } from '../serializers/price-list-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetPriceListBranchAssignmentsQuery = {
  current_user: AuthenticatedUserContext;
  price_list_id: number;
};

@Injectable()
export class GetPriceListBranchAssignmentsQueryUseCase
  implements
    QueryUseCase<
      GetPriceListBranchAssignmentsQuery,
      PriceListBranchAssignmentsView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_branch_assignments_repository: PriceListBranchAssignmentsRepository,
    private readonly price_list_branch_assignment_serializer: PriceListBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    price_list_id,
  }: GetPriceListBranchAssignmentsQuery): Promise<PriceListBranchAssignmentsView> {
    const business_id = resolve_effective_business_id(current_user);
    await this.pricing_validation_service.get_price_list_in_business(
      business_id,
      price_list_id,
    );

    const assignments =
      await this.price_list_branch_assignments_repository.find_all_by_price_list_in_business(
        business_id,
        price_list_id,
        resolve_effective_branch_scope_ids(current_user),
      );

    return {
      price_list_id,
      assignments: assignments.map((assignment) =>
        this.price_list_branch_assignment_serializer.serialize(assignment),
      ),
    };
  }
}
