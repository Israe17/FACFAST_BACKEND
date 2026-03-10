import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { REQUIRED_PERMISSIONS_KEY } from '../decorators/require-permissions.decorator';
import { AuthenticatedUserContext } from '../interfaces/authenticated-user-context.interface';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required_permissions = this.reflector.getAllAndOverride<string[]>(
      REQUIRED_PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!required_permissions?.length) {
      return true;
    }

    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUserContext }>();
    const user = request.user;
    if (!user) {
      throw new ForbiddenException('Missing authenticated user context.');
    }

    const has_all_permissions = required_permissions.every((permission) =>
      user.permissions.includes(permission),
    );
    if (!has_all_permissions) {
      throw new ForbiddenException(
        'Insufficient permissions for this operation.',
      );
    }

    return true;
  }
}
