import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { ContactBranchAssignmentView } from '../contracts/contact-branch-assignment.view';
import { ContactBranchAssignment } from '../entities/contact-branch-assignment.entity';

@Injectable()
export class ContactBranchAssignmentSerializer
  implements
    EntitySerializer<ContactBranchAssignment, ContactBranchAssignmentView>
{
  serialize(
    assignment: ContactBranchAssignment,
  ): ContactBranchAssignmentView {
    return {
      id: assignment.id,
      business_id: assignment.business_id,
      contact_id: assignment.contact_id,
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
      is_active: assignment.is_active,
      is_default: assignment.is_default,
      is_preferred: assignment.is_preferred,
      is_exclusive: assignment.is_exclusive,
      sales_enabled: assignment.sales_enabled,
      purchases_enabled: assignment.purchases_enabled,
      credit_enabled: assignment.credit_enabled,
      custom_credit_limit: assignment.custom_credit_limit,
      custom_price_list: assignment.custom_price_list
        ? {
            id: assignment.custom_price_list.id,
            code: assignment.custom_price_list.code,
            name: assignment.custom_price_list.name,
            kind: assignment.custom_price_list.kind,
            currency: assignment.custom_price_list.currency,
            is_active: assignment.custom_price_list.is_active,
          }
        : null,
      account_manager: assignment.account_manager_user
        ? {
            id: assignment.account_manager_user.id,
            code: assignment.account_manager_user.code,
            name: assignment.account_manager_user.name,
            email: assignment.account_manager_user.email,
            status: assignment.account_manager_user.status,
          }
        : null,
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
