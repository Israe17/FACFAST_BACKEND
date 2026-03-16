import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { DomainForbiddenException } from '../errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserContext } from '../interfaces/authenticated-user-context.interface';

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUserContext }>();
    const user = request.user;

    if (!user) {
      throw new DomainForbiddenException({
        code: 'PLATFORM_MISSING_AUTHENTICATED_USER',
        messageKey: 'platform.missing_authenticated_user',
      });
    }

    if (!user.is_platform_admin) {
      throw new DomainForbiddenException({
        code: 'PLATFORM_ADMIN_REQUIRED',
        messageKey: 'platform.admin_required',
      });
    }

    return true;
  }
}
