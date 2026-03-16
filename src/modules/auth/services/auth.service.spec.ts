import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import type { RefreshToken } from '../entities/refresh-token.entity';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import type { User } from '../../users/entities/user.entity';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { UsersService } from '../../users/services/users.service';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  type MockCookieResponse = {
    cookie: jest.Mock;
    clearCookie: jest.Mock;
  };

  const users_service = {
    find_user_for_login: jest.fn(),
    get_authenticated_context: jest.fn(),
    update_last_login: jest.fn(),
  } as unknown as jest.Mocked<UsersService>;

  const password_hash_service = {
    verify: jest.fn(),
    hash: jest.fn(),
  } as unknown as jest.Mocked<PasswordHashService>;

  const refresh_tokens_repository = {
    create: jest.fn((value: Partial<RefreshToken>) => value),
    save: jest.fn(),
    find_by_id_with_hash: jest.fn(),
    revoke: jest.fn(),
  } as unknown as jest.Mocked<RefreshTokensRepository>;

  const jwt_service = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;

  const config_values = new Map<string, string | boolean>([
    ['auth.access_token_secret', 'access-secret'],
    ['auth.refresh_token_secret', 'refresh-secret'],
    ['auth.access_token_expires_in', '15m'],
    ['auth.refresh_token_expires_in', '7d'],
    ['auth.access_cookie_name', 'ff_access_token'],
    ['auth.refresh_cookie_name', 'ff_refresh_token'],
    ['auth.cookie_same_site', 'lax'],
    ['auth.cookie_secure', false],
  ]);

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      users_service,
      password_hash_service,
      refresh_tokens_repository,
      jwt_service,
      {
        get: jest.fn((key: string, fallback?: unknown) =>
          config_values.has(key) ? config_values.get(key) : fallback,
        ),
        getOrThrow: jest.fn((key: string) => {
          const value = config_values.get(key);
          if (value === undefined) {
            throw new Error(`Missing config ${key}`);
          }
          return value;
        }),
      } as unknown as ConfigService,
    );
  });

  it('logs in successfully and sets HttpOnly cookies', async () => {
    users_service.find_user_for_login.mockResolvedValue({
      id: 10,
      business_id: 4,
      email: 'admin@test.com',
      password_hash: 'hash',
      status: UserStatus.ACTIVE,
      allow_login: true,
    } as unknown as User);
    password_hash_service.verify.mockResolvedValue(true);
    users_service.get_authenticated_context.mockResolvedValue({
      id: 10,
      business_id: 4,
      email: 'admin@test.com',
      name: 'Admin',
      roles: ['admin'],
      permissions: ['auth.login', 'auth.refresh'],
      branch_ids: [1],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    });
    refresh_tokens_repository.save
      .mockResolvedValueOnce({ id: 1, code: 'RT-0001' } as RefreshToken)
      .mockResolvedValueOnce({ id: 1, code: 'RT-0001' } as RefreshToken);
    jwt_service.signAsync
      .mockResolvedValueOnce('access-token')
      .mockResolvedValueOnce('refresh-token');
    password_hash_service.hash.mockResolvedValue('refresh-hash');

    const response: MockCookieResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    const result = await service.login(
      {
        email: 'admin@test.com',
        password: 'Password123',
      },
      {
        headers: {
          'user-agent': 'jest',
        },
        ip: '127.0.0.1',
      } as Request,
      response as unknown as Response,
    );

    expect(result.user.email).toBe('admin@test.com');
    expect(result.user).not.toHaveProperty('session_id');
    expect(response.cookie).toHaveBeenCalledTimes(2);
    expect(users_service.update_last_login.mock.calls).toContainEqual([10, 4]);
  });

  it('rejects login without auth.login permission', async () => {
    users_service.find_user_for_login.mockResolvedValue({
      id: 10,
      business_id: 4,
      email: 'admin@test.com',
      password_hash: 'hash',
      status: UserStatus.ACTIVE,
      allow_login: true,
    } as unknown as User);
    password_hash_service.verify.mockResolvedValue(true);
    users_service.get_authenticated_context.mockResolvedValue({
      id: 10,
      business_id: 4,
      email: 'admin@test.com',
      name: 'Admin',
      roles: ['cashier'],
      permissions: [],
      branch_ids: [1],
      max_sale_discount: 0,
      user_type: UserType.STAFF,
      is_platform_admin: false,
      acting_business_id: null,
      acting_branch_id: null,
      mode: AuthenticatedUserMode.TENANT,
      session_id: null,
    });

    await expect(
      service.login(
        {
          email: 'admin@test.com',
          password: 'Password123',
        },
        { headers: {}, ip: '127.0.0.1' } as Request,
        { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response,
      ),
    ).rejects.toBeInstanceOf(DomainForbiddenException);
  });

  it('rotates refresh tokens during refresh', async () => {
    refresh_tokens_repository.find_by_id_with_hash.mockResolvedValue({
      id: 5,
      user_id: 10,
      business_id: 4,
      acting_business_id: null,
      acting_branch_id: null,
      token_hash: 'stored-hash',
      expires_at: new Date(Date.now() + 60_000),
      revoked_at: null,
    } as RefreshToken);
    password_hash_service.verify.mockResolvedValue(true);
    refresh_tokens_repository.save
      .mockResolvedValueOnce({ id: 6, code: 'RT-0006' } as RefreshToken)
      .mockResolvedValueOnce({ id: 6, code: 'RT-0006' } as RefreshToken);
    jwt_service.signAsync
      .mockResolvedValueOnce('access-token-2')
      .mockResolvedValueOnce('refresh-token-2');
    password_hash_service.hash.mockResolvedValue('refresh-hash-2');
    await service.refresh(
      {
        id: 10,
        business_id: 4,
        email: 'admin@test.com',
        name: 'Admin',
        roles: ['admin'],
        permissions: ['auth.refresh'],
        branch_ids: [1],
        max_sale_discount: 0,
        user_type: UserType.STAFF,
        is_platform_admin: false,
        acting_business_id: null,
        acting_branch_id: null,
        mode: AuthenticatedUserMode.TENANT,
        session_id: 5,
      },
      'presented-refresh-token',
      {
        headers: {
          'user-agent': 'jest',
        },
        ip: '127.0.0.1',
      } as Request,
      { cookie: jest.fn(), clearCookie: jest.fn() } as unknown as Response,
    );

    expect(refresh_tokens_repository.revoke.mock.calls).toContainEqual([5]);
    expect(refresh_tokens_repository.save.mock.calls).toHaveLength(2);
  });

  it('clears cookies on logout even with invalid refresh token', async () => {
    jwt_service.verifyAsync.mockRejectedValue(
      new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_SESSION_NOT_FOUND',
        messageKey: 'auth.refresh_session_not_found',
      }),
    );

    const response: MockCookieResponse = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
    };
    const clear_cookie_mock = response.clearCookie;

    await expect(
      service.logout(
        {
          cookies: {
            ff_refresh_token: 'invalid',
          },
        } as Request,
        response as unknown as Response,
      ),
    ).resolves.toEqual({ success: true });

    expect(clear_cookie_mock).toHaveBeenCalledTimes(2);
  });
});
