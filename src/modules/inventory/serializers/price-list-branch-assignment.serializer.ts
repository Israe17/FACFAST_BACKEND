import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { PriceListBranchAssignmentView } from '../contracts/price-list-branch-assignment.view';
import { PriceListBranchAssignment } from '../entities/price-list-branch-assignment.entity';

@Injectable()
export class PriceListBranchAssignmentSerializer
  implements
    EntitySerializer<PriceListBranchAssignment, PriceListBranchAssignmentView>
{
  serialize(
    assignment: PriceListBranchAssignment,
  ): PriceListBranchAssignmentView {
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
      price_list: assignment.price_list
        ? {
            id: assignment.price_list.id,
            code: assignment.price_list.code,
            name: assignment.price_list.name,
            kind: assignment.price_list.kind,
            currency: assignment.price_list.currency,
            is_default: assignment.price_list.is_default,
            is_active: assignment.price_list.is_active,
          }
        : { id: assignment.price_list_id },
      is_active: assignment.is_active,
      is_default: assignment.is_default,
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
