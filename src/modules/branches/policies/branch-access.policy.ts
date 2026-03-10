import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';

@Injectable()
export class BranchAccessPolicy {
  is_owner(current_user: AuthenticatedUserContext): boolean {
    return current_user.user_type === UserType.OWNER;
  }

  assert_can_access_branch(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): void {
    if (this.is_owner(current_user)) {
      return;
    }

    if (!current_user.branch_ids.includes(branch_id)) {
      throw new ForbiddenException(
        'The user does not have access to this branch.',
      );
    }
  }

  assert_manageable_branch_ids(
    current_user: AuthenticatedUserContext,
    branch_ids: number[],
  ): void {
    if (this.is_owner(current_user)) {
      return;
    }

    const invalid_branch = branch_ids.find(
      (branch_id) => !current_user.branch_ids.includes(branch_id),
    );
    if (invalid_branch) {
      throw new ForbiddenException(
        `The authenticated user cannot operate on branch ${invalid_branch}.`,
      );
    }
  }
}
