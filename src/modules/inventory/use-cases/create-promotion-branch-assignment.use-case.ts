import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionBranchAssignmentView } from '../contracts/promotion-branch-assignment.view';
import { CreatePromotionBranchAssignmentDto } from '../dto/create-promotion-branch-assignment.dto';
import { PromotionBranchAssignmentPolicy } from '../policies/promotion-branch-assignment.policy';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PromotionBranchAssignmentSerializer } from '../serializers/promotion-branch-assignment.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type CreatePromotionBranchAssignmentCommand = {
  current_user: AuthenticatedUserContext;
  promotion_id: number;
  dto: CreatePromotionBranchAssignmentDto;
};

@Injectable()
export class CreatePromotionBranchAssignmentUseCase
  implements
    CommandUseCase<
      CreatePromotionBranchAssignmentCommand,
      PromotionBranchAssignmentView
    >
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
    private readonly promotion_branch_assignment_policy: PromotionBranchAssignmentPolicy,
    private readonly promotion_branch_assignment_serializer: PromotionBranchAssignmentSerializer,
  ) {}

  async execute({
    current_user,
    promotion_id,
    dto,
  }: CreatePromotionBranchAssignmentCommand): Promise<PromotionBranchAssignmentView> {
    const business_id = resolve_effective_business_id(current_user);
    const promotion =
      await this.pricing_validation_service.get_promotion_in_business(
        business_id,
        promotion_id,
      );
    const branch =
      await this.pricing_validation_service.get_branch_for_pricing_access(
        current_user,
        business_id,
        dto.branch_id,
      );

    const existing_assignment =
      await this.promotion_branch_assignments_repository.find_by_branch_and_promotion_in_business(
        business_id,
        branch.id,
        promotion.id,
      );
    if (existing_assignment) {
      throw new DomainConflictException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_DUPLICATE',
        messageKey: 'inventory.branch_promotion_assignment_duplicate',
        details: {
          branch_id: branch.id,
          promotion_id: promotion.id,
        },
      });
    }

    const next_is_active = dto.is_active ?? true;
    this.promotion_branch_assignment_policy.assert_promotion_active(
      promotion,
      next_is_active,
    );

    const saved_assignment =
      await this.promotion_branch_assignments_repository.save(
        this.promotion_branch_assignments_repository.create({
          business_id,
          promotion_id: promotion.id,
          branch_id: branch.id,
          is_active: next_is_active,
          notes: this.promotion_branch_assignment_policy.normalize_optional_string(
            dto.notes,
          ),
        }),
      );
    const hydrated_assignment =
      await this.pricing_validation_service.get_promotion_branch_assignment_in_business(
        business_id,
        saved_assignment.id,
      );

    return this.promotion_branch_assignment_serializer.serialize(
      hydrated_assignment,
    );
  }
}
