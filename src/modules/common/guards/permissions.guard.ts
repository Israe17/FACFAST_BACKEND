import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ALLOW_PLATFORM_PERMISSION_OVERRIDE_KEY } from '../decorators/allow-platform-permission-override.decorator';
import { ALLOW_PLATFORM_TENANT_CONTEXT_KEY } from '../decorators/allow-platform-tenant-context.decorator';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { DomainForbiddenException } from '../errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserContext } from '../interfaces/authenticated-user-context.interface';
import { is_platform_tenant_context } from '../utils/tenant-context.util';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required_permissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    const allow_platform_tenant_context =
      this.reflector.getAllAndOverride<boolean>(
        ALLOW_PLATFORM_TENANT_CONTEXT_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? false;
    const allow_platform_permission_override =
      this.reflector.getAllAndOverride<boolean>(
        ALLOW_PLATFORM_PERMISSION_OVERRIDE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? false;

    if (!required_permissions?.length) {
      return true;
    }

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

    if (
      allow_platform_tenant_context &&
      allow_platform_permission_override &&
      is_platform_tenant_context(user)
    ) {
      return true;
    }

    const has_all_permissions = required_permissions.every((permission) =>
      user.permissions.includes(permission),
    );
    if (!has_all_permissions) {
      throw new DomainForbiddenException({
        code: 'FORBIDDEN',
        messageKey: 'errors.forbidden',
      });
    }

    return true;
  }
}
