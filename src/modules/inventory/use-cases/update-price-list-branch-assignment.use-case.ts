import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListBranchAssignmentView } from '../contracts/price-list-branch-assignment.view';
import { UpdatePriceListBranchAssignmentDto } from '../dto/update-price-list-branch-assignment.dto';
import { PriceListBranchAssignmentPolicy } from '../policies/price-list-branch-assignment.policy';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PriceListBranchAssignmentSerializer } from '../serializers/price-list-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type UpdatePriceListBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  assignment_id: number;
  dto: UpdatePriceListBranchAssignmentDto;
  price_list_id?: number;
};

@Injectable()
export class UpdatePriceListBranchAssignmentUseCase
  implements
    CommandUseCase<
      UpdatePriceListBranchAssignmentCommand,
      PriceListBranchAssignmentView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly price_list_branch_assignments_repository: PriceListBranchAssignmentsRepository,
    private readonly price_list_branch_assignment_policy: PriceListBranchAssignmentPolicy,
    private readonly price_list_branch_assignment_serializer: PriceListBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    assignment_id,
    dto,
    price_list_id,
  }: UpdatePriceListBranchAssignmentCommand): Promise<PriceListBranchAssignmentView> {
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

    const next_is_active = dto.is_active ?? assignment.is_active;
    const next_is_default = dto.is_default ?? assignment.is_default;
    this.price_list_branch_assignment_policy.assert_default_requires_active(
      next_is_default,
      next_is_active,
    );
    this.price_list_branch_assignment_policy.assert_price_list_active(
      assignment.price_list,
      next_is_active || next_is_default,
    );

    if (dto.is_active !== undefined) {
      assignment.is_active = dto.is_active;
      if (!dto.is_active) {
        assignment.is_default = false;
      }
    }
    if (dto.is_default !== undefined) {
      assignment.is_default = dto.is_default;
    }
    if (dto.notes !== undefined) {
      assignment.notes =
        this.price_list_branch_assignment_policy.normalize_optional_string(
          dto.notes,
        );
    }

    if (next_is_default) {
      await this.price_list_branch_assignments_repository.unset_default_for_branch(
        business_id,
        assignment.branch_id,
        assignment.id,
      );
    }

    const saved_assignment =
      await this.price_list_branch_assignments_repository.save(assignment);
    const hydrated_assignment =
      await this.pricing_validation_service.get_price_list_branch_assignment_in_business(
        business_id,
        saved_assignment.id,
      );

    return this.price_list_branch_assignment_serializer.serialize(
      hydrated_assignment,
    );
  }
}
