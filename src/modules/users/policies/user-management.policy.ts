import { Injectable } from '@nestjs/common';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  is_platform_tenant_context,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { User } from '../entities/user.entity';

@Injectable()
export class UserManagementPolicy {
  assert_can_manage_user(
    current_user: AuthenticatedUserContext,
    target_user: User,
  ): void {
    if (
      resolve_effective_business_id(current_user) !== target_user.business_id
    ) {
      throw new DomainForbiddenException({
        code: 'USER_CROSS_BUSINESS_MANAGEMENT_FORBIDDEN',
        messageKey: 'users.cross_business_management_forbidden',
      });
    }

    if (is_platform_tenant_context(current_user)) {
      return;
    }

    if (
      target_user.user_type === UserType.SYSTEM &&
      current_user.user_type !== UserType.SYSTEM
    ) {
      throw new DomainForbiddenException({
        code: 'USER_SYSTEM_MANAGEMENT_FORBIDDEN',
        messageKey: 'users.system_management_forbidden',
      });
    }

    if (
      target_user.user_type === UserType.OWNER &&
      current_user.user_type !== UserType.OWNER &&
      current_user.id !== target_user.id
    ) {
      throw new DomainForbiddenException({
        code: 'USER_OWNER_MANAGEMENT_FORBIDDEN',
        messageKey: 'users.owner_management_forbidden',
      });
    }
  }

  assert_can_assign_owner_user_type(
    current_user: AuthenticatedUserContext,
  ): void {
    if (
      current_user.user_type !== UserType.OWNER &&
      !is_platform_tenant_context(current_user)
    ) {
      throw new DomainForbiddenException({
        code: 'USER_OWNER_ASSIGNMENT_FORBIDDEN',
        messageKey: 'users.owner_assignment_forbidden',
      });
    }
  }
}
