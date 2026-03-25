import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PricingValidationService } from '../services/pricing-validation.service';

export type DeletePriceListBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
  price_list_id?: number;
};

export type DeletePriceListBranchAssignmentResult = {
  id: number;
  deleted: true;
};

@Injectable()
export class DeletePriceListBranchAssignmentUseCase
  implements
    CommandUseCase<
      DeletePriceListBranchAssignmentCommand,
      DeletePriceListBranchAssignmentResult
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_branch_assignments_repository: PriceListBranchAssignmentsRepository,
  ) {}

  async execute({
    current_user,
    assignment_id,
    price_list_id,
  }: DeletePriceListBranchAssignmentCommand): Promise<DeletePriceListBranchAssignmentResult> {
    const business_id = resolve_effective_business_id(current_user);
    const assignment =
      await this.pricing_validation_service.get_price_list_branch_assignment_in_business(
        business_id,
        assignment_id,
      );

    if (
      price_list_id !== undefined &&
      assignment.price_list_id !== price_list_id
    ) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_price_list_assignment_not_found',
        details: {
          assignment_id,
          price_list_id,
        },
      });
    }

    await this.pricing_validation_service.get_branch_for_pricing_access(
      current_user,
      business_id,
      assignment.branch_id,
    );
    await this.price_list_branch_assignments_repository.remove(assignment);

    return {
      id: assignment_id,
      deleted: true,
    };
  }
}
