import { ForbiddenException, Injectable } from '@nestjs/common';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { User } from '../entities/user.entity';

@Injectable()
export class UserManagementPolicy {
  assert_can_manage_user(
    current_user: AuthenticatedUserContext,
    target_user: User,
  ): void {
    if (current_user.business_id !== target_user.business_id) {
      throw new ForbiddenException(
        'Cross-business user management is not allowed.',
      );
    }

    if (
      target_user.user_type === UserType.SYSTEM &&
      current_user.user_type !== UserType.SYSTEM
    ) {
      throw new ForbiddenException(
        'System users cannot be managed by this user.',
      );
    }

    if (
      target_user.user_type === UserType.OWNER &&
      current_user.user_type !== UserType.OWNER &&
      current_user.id !== target_user.id
    ) {
      throw new ForbiddenException(
        'Owner users can only be managed by owners.',
      );
    }
  }

  assert_can_assign_owner_user_type(
    current_user: AuthenticatedUserContext,
  ): void {
    if (current_user.user_type !== UserType.OWNER) {
      throw new ForbiddenException(
        'Only owners can create or update owner users.',
      );
    }
  }
}
