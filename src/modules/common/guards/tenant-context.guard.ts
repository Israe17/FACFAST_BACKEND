import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../interfaces/authenticated-user-context.interface';
import { assert_tenant_context_active } from '../utils/tenant-context.util';

@Injectable()
export class TenantContextGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: AuthenticatedUserContext }>();
    const user = request.user;

    if (!user) {
      return false;
    }

    assert_tenant_context_active(user);
    return true;
  }
}
