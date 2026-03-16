import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { UserType } from '../../common/enums/user-type.enum';
import { PlatformContextService } from './platform-context.service';

describe('PlatformContextService', () => {
  const refresh_tokens_repository = {
    update_acting_context: jest.fn(),
  };

  const businesses_repository = {
    find_by_id: jest.fn(),
  };

  const branches_repository = {
    find_by_id_in_business: jest.fn(),
  };

  const users_service = {
    get_authenticated_context: jest.fn(),
  };

  let service: PlatformContextService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlatformContextService(
      refresh_tokens_repository as never,
      businesses_repository as never,
      branches_repository as never,
      users_service as never,
    );
  });

  it('activates tenant context for a platform admin session', async () => {
    businesses_repository.find_by_id.mockResolvedValue({
      id: 7,
      is_active: true,
    });
    users_service.get_authenticated_context.mockResolvedValue({
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
      session_id: 25,
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

    expect(
      refresh_tokens_repository.update_acting_context,
    ).toHaveBeenCalledWith(25, 7, null);
  });

  it('rejects branches outside the selected business', async () => {
    businesses_repository.find_by_id.mockResolvedValue({
      id: 7,
      is_active: true,
    });
    branches_repository.find_by_id_in_business.mockResolvedValue(null);

    await expect(
      service.enter_business_context(build_platform_user(), {
        business_id: 7,
        branch_id: 999,
      }),
    ).rejects.toBeInstanceOf(DomainBadRequestException);
  });

  it('clears the tenant context from the current session', async () => {
    users_service.get_authenticated_context.mockResolvedValue({
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
      session_id: 25,
    });

    await expect(
      service.clear_business_context(build_platform_user()),
    ).resolves.toMatchObject({
      success: true,
      acting_business_id: null,
      mode: AuthenticatedUserMode.PLATFORM,
    });

    expect(
      refresh_tokens_repository.update_acting_context,
    ).toHaveBeenCalledWith(25, null, null);
  });

  it('requires a resolved session id', async () => {
    await expect(
      service.clear_business_context({
        ...build_platform_user(),
        session_id: null,
      }),
    ).rejects.toBeInstanceOf(DomainUnauthorizedException);
  });

  it('fails when the selected business does not exist', async () => {
    businesses_repository.find_by_id.mockResolvedValue(null);

    await expect(
      service.enter_business_context(build_platform_user(), {
        business_id: 404,
      }),
    ).rejects.toBeInstanceOf(DomainNotFoundException);
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
