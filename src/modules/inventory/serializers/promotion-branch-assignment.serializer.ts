import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { PromotionBranchAssignmentView } from '../contracts/promotion-branch-assignment.view';
import { PromotionBranchAssignment } from '../entities/promotion-branch-assignment.entity';

@Injectable()
export class PromotionBranchAssignmentSerializer
  implements
    EntitySerializer<PromotionBranchAssignment, PromotionBranchAssignmentView>
{
  serialize(
    assignment: PromotionBranchAssignment,
  ): PromotionBranchAssignmentView {
    return {
      id: assignment.id,
      business_id: assignment.business_id,
      branch: assignment.branch
        ? {
            id: assignment.branch.id,
            code: assignment.branch.code,
            name: assignment.branch.name,
            business_name: assignment.branch.business_name,
            branch_number: assignment.branch.branch_number,
            is_active: assignment.branch.is_active,
          }
        : { id: assignment.branch_id },
      promotion: assignment.promotion
        ? {
            id: assignment.promotion.id,
            code: assignment.promotion.code,
            name: assignment.promotion.name,
            type: assignment.promotion.type,
            valid_from: assignment.promotion.valid_from,
            valid_to: assignment.promotion.valid_to,
            is_active: assignment.promotion.is_active,
          }
        : { id: assignment.promotion_id },
      is_active: assignment.is_active,
      notes: assignment.notes,
      lifecycle: {
        can_delete: true,
        can_deactivate: assignment.is_active,
        can_reactivate: !assignment.is_active,
        reasons: [],
      },
      created_at: assignment.created_at,
      updated_at: assignment.updated_at,
    };
  }
}
