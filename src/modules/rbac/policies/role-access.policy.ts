import { Injectable } from '@nestjs/common';
import { AccessPolicy } from '../../common/application/interfaces/access-policy.interface';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';

@Injectable()
export class RoleAccessPolicy implements AccessPolicy<{ business_id: number }> {
  assert_can_access(
    current_user: AuthenticatedUserContext,
    subject: { business_id: number },
  ): void {
    if (subject.business_id !== resolve_effective_business_id(current_user)) {
      throw new DomainForbiddenException({
        code: 'RBAC_ROLE_ACCESS_FORBIDDEN',
        messageKey: 'rbac.role_access_forbidden',
        details: {
          business_id: subject.business_id,
        },
      });
    }
  }

  assert_can_access_role(
    current_user: AuthenticatedUserContext,
    role: { business_id: number },
  ): void {
    this.assert_can_access(current_user, role);
  }
}
