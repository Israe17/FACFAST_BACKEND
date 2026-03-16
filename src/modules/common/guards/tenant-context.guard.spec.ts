import { ExecutionContext } from '@nestjs/common/interfaces';
import { AuthenticatedUserMode } from '../enums/authenticated-user-mode.enum';
import { DomainForbiddenException } from '../errors/exceptions/domain-forbidden.exception';
import { UserType } from '../enums/user-type.enum';
import { TenantContextGuard } from './tenant-context.guard';

describe('TenantContextGuard', () => {
  const guard = new TenantContextGuard();

  it('allows tenant users without acting context', () => {
    expect(
      guard.canActivate(
        build_context({
          id: 10,
          business_id: 5,
          email: 'tenant@test.com',
          name: 'Tenant',
          roles: ['owner'],
          permissions: ['users.view'],
          branch_ids: [1],
          max_sale_discount: 0,
          user_type: UserType.OWNER,
          is_platform_admin: false,
          acting_business_id: null,
          acting_branch_id: null,
          mode: AuthenticatedUserMode.TENANT,
          session_id: 50,
        }),
      ),
    ).toBe(true);
  });

  it('rejects platform admins without tenant context', () => {
    expect(() =>
      guard.canActivate(
        build_context({
          id: 1,
          business_id: 1,
          email: 'platform@test.com',
          name: 'Platform',
          roles: [],
          permissions: ['auth.login'],
          branch_ids: [],
          max_sale_discount: 0,
          user_type: UserType.SYSTEM,
          is_platform_admin: true,
          acting_business_id: null,
          acting_branch_id: null,
          mode: AuthenticatedUserMode.PLATFORM,
          session_id: 20,
        }),
      ),
    ).toThrow(DomainForbiddenException);
  });

  it('allows platform admins with tenant context', () => {
    expect(
      guard.canActivate(
        build_context({
          id: 1,
          business_id: 1,
          email: 'platform@test.com',
          name: 'Platform',
          roles: [],
          permissions: ['auth.login'],
          branch_ids: [],
          max_sale_discount: 0,
          user_type: UserType.SYSTEM,
          is_platform_admin: true,
          acting_business_id: 7,
          acting_branch_id: null,
          mode: AuthenticatedUserMode.TENANT_CONTEXT,
          session_id: 20,
        }),
      ),
    ).toBe(true);
  });
});

function build_context(user: object): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        user,
      }),
    }),
  } as ExecutionContext;
}
