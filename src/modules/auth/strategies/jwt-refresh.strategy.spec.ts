import { ConfigService } from '@nestjs/config';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { JwtRefreshStrategy } from './jwt-refresh.strategy';

describe('JwtRefreshStrategy', () => {
  const users_service = {
    get_authenticated_context: jest.fn(),
  };

  const refresh_tokens_repository = {
    find_by_id: jest.fn(),
  };

  let strategy: JwtRefreshStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtRefreshStrategy(
      {
        get: jest.fn((_key: string, fallback?: unknown) => fallback),
        getOrThrow: jest.fn(() => 'refresh-secret'),
      } as unknown as ConfigService,
      users_service as never,
      refresh_tokens_repository as never,
    );
  });

  it('throws a domain unauthorized exception when the refresh session is missing', async () => {
    refresh_tokens_repository.find_by_id.mockResolvedValue(null);

    await expect(
      strategy.validate({
        sub: 1,
        business_id: 2,
        email: 'admin@test.com',
        session_id: 3,
      }),
    ).rejects.toBeInstanceOf(DomainUnauthorizedException);

    try {
      await strategy.validate({
        sub: 1,
        business_id: 2,
        email: 'admin@test.com',
        session_id: 3,
      });
    } catch (error) {
      const response = (error as DomainUnauthorizedException).getResponse() as {
        code: string;
        messageKey: string;
      };
      expect(response.code).toBe('AUTH_REFRESH_SESSION_NOT_FOUND');
      expect(response.messageKey).toBe('auth.refresh_session_not_found');
    }
  });
});
