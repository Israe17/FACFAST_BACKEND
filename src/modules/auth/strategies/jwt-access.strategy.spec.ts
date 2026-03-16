import { ConfigService } from '@nestjs/config';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { JwtAccessStrategy } from './jwt-access.strategy';

describe('JwtAccessStrategy', () => {
  const users_service = {
    get_authenticated_context: jest.fn(),
  };

  const refresh_tokens_repository = {
    find_by_id: jest.fn(),
  };

  let strategy: JwtAccessStrategy;

  beforeEach(() => {
    jest.clearAllMocks();
    strategy = new JwtAccessStrategy(
      {
        get: jest.fn((_key: string, fallback?: unknown) => fallback),
        getOrThrow: jest.fn(() => 'access-secret'),
      } as unknown as ConfigService,
      users_service as never,
      refresh_tokens_repository as never,
    );
  });

  it('throws a domain unauthorized exception when the access session is missing', async () => {
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
      expect(response.code).toBe('AUTH_ACCESS_SESSION_NOT_FOUND');
      expect(response.messageKey).toBe('auth.access_session_not_found');
    }
  });
});
