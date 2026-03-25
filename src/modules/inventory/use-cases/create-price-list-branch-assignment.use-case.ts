import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListBranchAssignmentView } from '../contracts/price-list-branch-assignment.view';
import { CreatePriceListBranchAssignmentDto } from '../dto/create-price-list-branch-assignment.dto';
import { PriceListBranchAssignmentPolicy } from '../policies/price-list-branch-assignment.policy';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PriceListBranchAssignmentSerializer } from '../serializers/price-list-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type CreatePriceListBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  price_list_id: number;
  dto: CreatePriceListBranchAssignmentDto;
};

@Injectable()
export class CreatePriceListBranchAssignmentUseCase
  implements
    CommandUseCase<
      CreatePriceListBranchAssignmentCommand,
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
    price_list_id,
    dto,
  }: CreatePriceListBranchAssignmentCommand): Promise<PriceListBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    const price_list =
      await this.pricing_validation_service.get_price_list_in_business(
        business_id,
        price_list_id,
      );
    const branch =
      await this.pricing_validation_service.get_branch_for_pricing_access(
        current_user,
        business_id,
        dto.branch_id,
      );

    const existing_assignment =
      await this.price_list_branch_assignments_repository.find_by_branch_and_price_list_in_business(
        business_id,
        branch.id,
        price_list.id,
      );
    if (existing_assignment) {
      throw new DomainConflictException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_DUPLICATE',
        messageKey: 'inventory.branch_price_list_assignment_duplicate',
        details: {
          branch_id: branch.id,
          price_list_id: price_list.id,
        },
      });
    }

    const next_is_active = dto.is_active ?? true;
    const next_is_default = dto.is_default ?? false;
    this.price_list_branch_assignment_policy.assert_default_requires_active(
      next_is_default,
      next_is_active,
    );
    this.price_list_branch_assignment_policy.assert_price_list_active(
      price_list,
      next_is_active || next_is_default,
    );

    if (next_is_default) {
      await this.price_list_branch_assignments_repository.unset_default_for_branch(
        business_id,
        branch.id,
        0,
      );
    }

    const saved_assignment =
      await this.price_list_branch_assignments_repository.save(
        this.price_list_branch_assignments_repository.create({
          business_id,
          price_list_id: price_list.id,
          branch_id: branch.id,
          is_active: next_is_active,
          is_default: next_is_default,
          notes: this.price_list_branch_assignment_policy.normalize_optional_string(
            dto.notes,
          ),
        }),
      );
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
