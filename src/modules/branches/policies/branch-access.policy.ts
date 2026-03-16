import { Injectable } from '@nestjs/common';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  can_access_effective_branch,
  has_full_effective_branch_access,
} from '../../common/utils/tenant-context.util';

@Injectable()
export class BranchAccessPolicy {
  is_owner(current_user: AuthenticatedUserContext): boolean {
    return current_user.user_type === UserType.OWNER;
  }

  assert_can_access_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): void {
    if (
      this.is_owner(current_user) ||
      has_full_effective_branch_access(current_user)
    ) {
      return;
    }

    if (!can_access_effective_branch(current_user, branch_id)) {
      throw new DomainForbiddenException({
        code: 'BRANCH_ACCESS_FORBIDDEN',
        messageKey: 'branches.access_forbidden',
        details: {
          branch_id,
        },
      });
    }
  }

  assert_manageable_branch_ids(
    current_user: AuthenticatedUserContext,
    branch_ids: number[],
  ): void {
    if (
      this.is_owner(current_user) ||
      has_full_effective_branch_access(current_user)
    ) {
      return;
    }

    const invalid_branch = branch_ids.find(
      (branch_id) => !can_access_effective_branch(current_user, branch_id),
    );
    if (invalid_branch) {
      throw new DomainForbiddenException({
        code: 'BRANCH_MANAGE_SCOPE_FORBIDDEN',
        messageKey: 'branches.manage_scope_forbidden',
        details: {
          branch_id: invalid_branch,
        },
      });
    }
  }

  assert_can_access_any_branch(
    current_user: AuthenticatedUserContext,
    branch_ids: number[],
  ): void {
    if (
      this.is_owner(current_user) ||
      has_full_effective_branch_access(current_user)
    ) {
      return;
    }

    const can_access_any_branch = branch_ids.some((branch_id) =>
      can_access_effective_branch(current_user, branch_id),
    );
    if (!can_access_any_branch) {
      throw new DomainForbiddenException({
        code: 'BRANCH_ACCESS_FORBIDDEN',
        messageKey: 'branches.access_forbidden',
        details: {
          branch_ids,
        },
      });
    }
  }
}
