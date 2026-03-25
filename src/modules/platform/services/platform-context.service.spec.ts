import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { ClearPlatformBusinessContextUseCase } from '../use-cases/clear-platform-business-context.use-case';
import { EnterPlatformBusinessContextUseCase } from '../use-cases/enter-platform-business-context.use-case';
import { PlatformContextService } from './platform-context.service';

describe('PlatformContextService', () => {
  const enter_platform_business_context_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<EnterPlatformBusinessContextUseCase>;

  const clear_platform_business_context_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<ClearPlatformBusinessContextUseCase>;

  let service: PlatformContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlatformContextService(
      enter_platform_business_context_use_case,
      clear_platform_business_context_use_case,
    );
  });

  it('activates tenant context for a platform admin session', async () => {
    enter_platform_business_context_use_case.execute.mockResolvedValue({
      success: true,
      acting_business_id: 7,
      acting_branch_id: null,
      business_id: 1,
      is_platform_admin: true,
      mode: AuthenticatedUserMode.TENANT_CONTEXT,
      platform_ready: true,
      tenant_context_active: true,
    });

    await expect(
      service.enter_business_context(build_platform_user(), {
        business_id: 7,
      }),
    ).resolves.toMatchObject({
      success: true,
      acting_business_id: 7,
      mode: AuthenticatedUserMode.TENANT_CONTEXT,
    });
  });

  it('clears the tenant context from the current session', async () => {
    clear_platform_business_context_use_case.execute.mockResolvedValue({
      success: true,
      acting_business_id: null,
      acting_branch_id: null,
      business_id: 1,
      is_platform_admin: true,
      mode: AuthenticatedUserMode.PLATFORM,
      platform_ready: true,
      tenant_context_active: false,
    });

    await expect(
      service.clear_business_context(build_platform_user()),
    ).resolves.toMatchObject({
      success: true,
      acting_business_id: null,
      mode: AuthenticatedUserMode.PLATFORM,
    });
  });
});

function build_platform_user() {
  return {
    id: 1,
    business_id: 1,
    email: 'platform@test.com',
    name: 'Platform',
    roles: [],
    permissions: ['auth.login', 'auth.refresh'],
    branch_ids: [],
    max_sale_discount: 0,
    user_type: UserType.SYSTEM,
    is_platform_admin: true,
    acting_business_id: null,
    acting_branch_id: null,
    mode: AuthenticatedUserMode.PLATFORM,
    session_id: 25,
  };
}
