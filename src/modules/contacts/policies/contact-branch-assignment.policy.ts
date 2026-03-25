import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

@Injectable()
export class ContactBranchAssignmentPolicy {
  normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  assert_account_manager_can_access_branch(
    user: {
      user_type: string;
      is_platform_admin?: boolean;
      user_branch_access?: Array<{ branch_id: number }>;
    },
    branch_id: number,
  ): void {
    if (user.is_platform_admin === true || user.user_type === 'owner') {
      return;
    }

    const branch_ids =
      user.user_branch_access?.map((assignment) => assignment.branch_id) ?? [];
    if (!branch_ids.length || branch_ids.includes(branch_id)) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'CONTACT_ACCOUNT_MANAGER_BRANCH_SCOPE_INVALID',
      messageKey: 'contacts.account_manager_branch_scope_invalid',
      details: {
        account_manager_user_id: (user as { id?: number }).id,
        branch_id,
      },
    });
  }
}
