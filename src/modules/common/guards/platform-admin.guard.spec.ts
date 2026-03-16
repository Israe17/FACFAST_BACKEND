import { ExecutionContext } from '@nestjs/common/interfaces';
import { AuthenticatedUserMode } from '../enums/authenticated-user-mode.enum';
import { DomainForbiddenException } from '../errors/exceptions/domain-forbidden.exception';
import { UserType } from '../enums/user-type.enum';
import { PlatformAdminGuard } from './platform-admin.guard';

describe('PlatformAdminGuard', () => {
  const guard = new PlatformAdminGuard();

  it('allows platform admins', () => {
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
          acting_business_id: null,
          acting_branch_id: null,
          mode: AuthenticatedUserMode.PLATFORM,
          session_id: 1,
        }),
      ),
    ).toBe(true);
  });

  it('rejects tenant users', () => {
    expect(() =>
      guard.canActivate(
        build_context({
          id: 2,
          business_id: 2,
          email: 'tenant@test.com',
          name: 'Tenant',
          roles: ['owner'],
          permissions: ['auth.login'],
          branch_ids: [1],
          max_sale_discount: 0,
          user_type: UserType.OWNER,
          is_platform_admin: false,
          acting_business_id: null,
          acting_branch_id: null,
          mode: AuthenticatedUserMode.TENANT,
          session_id: 2,
        }),
      ),
    ).toThrow(DomainForbiddenException);
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
