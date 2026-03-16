import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Request, Response } from 'express';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { UserStatus } from '../../common/enums/user-status.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { JwtAccessPayload } from '../../common/interfaces/jwt-access-payload.interface';
import { JwtRefreshPayload } from '../../common/interfaces/jwt-refresh-payload.interface';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { UsersService } from '../../users/services/users.service';
import { LoginDto } from '../dto/login.dto';
import { RefreshSessionUser } from '../interfaces/refresh-session-user.interface';
import { TokenPair } from '../interfaces/token-pair.interface';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { build_auth_cookie_options } from '../utils/auth-cookie.util';
import { extract_cookie_token } from '../utils/cookie-extractor.util';
import { duration_to_milliseconds } from '../utils/duration.util';
import { get_request_ip } from '../utils/request-client.util';

@Injectable()
export class AuthService {
  constructor(
    private readonly users_service: UsersService,
    private readonly password_hash_service: PasswordHashService,
    private readonly refresh_tokens_repository: RefreshTokensRepository,
    private readonly jwt_service: JwtService,
    private readonly config_service: ConfigService,
  ) {}

  async login(dto: LoginDto, request: Request, response: Response) {
    const user = await this.users_service.find_user_for_login(dto.email);
    if (!user || !user.password_hash) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        messageKey: 'auth.invalid_credentials',
      });
    }

    if (user.status !== UserStatus.ACTIVE || user.allow_login === false) {
      throw new DomainForbiddenException({
        code: 'AUTH_LOGIN_FORBIDDEN_STATE',
        messageKey: 'auth.login_forbidden_state',
      });
    }

    const password_matches = await this.password_hash_service.verify(
      user.password_hash,
      dto.password,
    );
    if (!password_matches) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        messageKey: 'auth.invalid_credentials',
      });
    }

    const authenticated_user =
      await this.users_service.get_authenticated_context(
        user.id,
        user.business_id,
        false,
      );
    if (!authenticated_user) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_CONTEXT_RESOLUTION_FAILED',
        messageKey: 'auth.context_resolution_failed',
      });
    }

    if (!authenticated_user.permissions.includes('auth.login')) {
      throw new DomainForbiddenException({
        code: 'AUTH_LOGIN_PERMISSION_DENIED',
        messageKey: 'auth.login_permission_denied',
      });
    }

    const token_pair = await this.issue_session(authenticated_user, request);
    await this.users_service.update_last_login(user.id, user.business_id);
    this.set_auth_cookies(response, token_pair);

    return {
      user: this.sanitize_authenticated_user(authenticated_user),
    };
  }

  async refresh(
    refresh_user: RefreshSessionUser,
    refresh_token: string,
    request: Request,
    response: Response,
  ) {
    if (!refresh_user.permissions.includes('auth.refresh')) {
      throw new DomainForbiddenException({
        code: 'AUTH_REFRESH_PERMISSION_DENIED',
        messageKey: 'auth.refresh_permission_denied',
      });
    }

    const persisted_token =
      await this.refresh_tokens_repository.find_by_id_with_hash(
        refresh_user.session_id,
      );
    if (!persisted_token?.token_hash) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_SESSION_NOT_FOUND',
        messageKey: 'auth.refresh_session_not_found',
      });
    }

    if (persisted_token.user_id !== refresh_user.id) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_SESSION_USER_MISMATCH',
        messageKey: 'auth.refresh_session_user_mismatch',
      });
    }
    if (persisted_token.business_id !== refresh_user.business_id) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_SESSION_BUSINESS_MISMATCH',
        messageKey: 'auth.refresh_session_business_mismatch',
      });
    }
    if (persisted_token.revoked_at) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_SESSION_REVOKED',
        messageKey: 'auth.refresh_session_revoked',
      });
    }
    if (persisted_token.expires_at.getTime() <= Date.now()) {
      await this.refresh_tokens_repository.revoke(persisted_token.id);
      throw new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_SESSION_EXPIRED',
        messageKey: 'auth.refresh_session_expired',
      });
    }

    const token_matches = await this.password_hash_service.verify(
      persisted_token.token_hash,
      refresh_token,
    );
    if (!token_matches) {
      await this.refresh_tokens_repository.revoke(persisted_token.id);
      throw new DomainUnauthorizedException({
        code: 'AUTH_REFRESH_TOKEN_MISMATCH',
        messageKey: 'auth.refresh_token_mismatch',
      });
    }

    await this.refresh_tokens_repository.revoke(persisted_token.id);
    const token_pair = await this.issue_session(refresh_user, request);
    this.set_auth_cookies(response, token_pair);

    return {
      user: this.sanitize_authenticated_user(refresh_user),
    };
  }

  async logout(request: Request, response: Response) {
    const refresh_cookie_name = this.config_service.get<string>(
      'auth.refresh_cookie_name',
      'ff_refresh_token',
    );
    const refresh_token = extract_cookie_token(request, refresh_cookie_name);

    if (refresh_token) {
      try {
        const payload = await this.jwt_service.verifyAsync<JwtRefreshPayload>(
          refresh_token,
          {
            secret: this.config_service.getOrThrow<string>(
              'auth.refresh_token_secret',
            ),
          },
        );
        await this.refresh_tokens_repository.revoke(payload.session_id);
      } catch {
        // Ignore invalid refresh tokens; cookies are cleared anyway.
      }
    }

    this.clear_auth_cookies(response);
    return {
      success: true,
    };
  }

  get_me(current_user: AuthenticatedUserContext) {
    return this.sanitize_authenticated_user(current_user);
  }

  private async issue_session(
    authenticated_user: AuthenticatedUserContext,
    request: Request,
  ): Promise<TokenPair> {
    const refresh_expires_in = this.config_service.get<string>(
      'auth.refresh_token_expires_in',
      '7d',
    );
    const expires_at = new Date(
      Date.now() + duration_to_milliseconds(refresh_expires_in),
    );

    let refresh_session = this.refresh_tokens_repository.create({
      user_id: authenticated_user.id,
      business_id: authenticated_user.business_id,
      acting_business_id: authenticated_user.acting_business_id,
      acting_branch_id: authenticated_user.acting_branch_id,
      token_hash: 'pending',
      expires_at,
      revoked_at: null,
      user_agent: request.headers['user-agent']?.slice(0, 255) ?? null,
      ip_address: get_request_ip(request),
      code: null,
    });
    refresh_session =
      await this.refresh_tokens_repository.save(refresh_session);

    const access_payload: JwtAccessPayload = {
      sub: authenticated_user.id,
      business_id: authenticated_user.business_id,
      email: authenticated_user.email,
      session_id: refresh_session.id,
    };
    const refresh_payload: JwtRefreshPayload = { ...access_payload };

    const [access_token, refresh_token] = await Promise.all([
      this.jwt_service.signAsync(access_payload, {
        secret: this.config_service.getOrThrow<string>(
          'auth.access_token_secret',
        ),
        expiresIn: this.config_service.getOrThrow<string>(
          'auth.access_token_expires_in',
        ) as never,
      }),
      this.jwt_service.signAsync(refresh_payload, {
        secret: this.config_service.getOrThrow<string>(
          'auth.refresh_token_secret',
        ),
        expiresIn: refresh_expires_in as never,
      }),
    ]);

    refresh_session.token_hash =
      await this.password_hash_service.hash(refresh_token);
    await this.refresh_tokens_repository.save(refresh_session);

    return {
      access_token,
      refresh_token,
    };
  }

  private set_auth_cookies(response: Response, token_pair: TokenPair): void {
    const same_site = this.config_service.get<'lax' | 'strict' | 'none'>(
      'auth.cookie_same_site',
      'none',
    );
    const secure = this.config_service.get<boolean>('auth.cookie_secure', true);
    const access_cookie_name = this.config_service.get<string>(
      'auth.access_cookie_name',
      'ff_access_token',
    );
    const refresh_cookie_name = this.config_service.get<string>(
      'auth.refresh_cookie_name',
      'ff_refresh_token',
    );

    response.cookie(
      access_cookie_name,
      token_pair.access_token,
      build_auth_cookie_options(
        duration_to_milliseconds(
          this.config_service.get<string>(
            'auth.access_token_expires_in',
            '15m',
          ),
        ),
        same_site,
        secure,
      ),
    );
    response.cookie(
      refresh_cookie_name,
      token_pair.refresh_token,
      build_auth_cookie_options(
        duration_to_milliseconds(
          this.config_service.get<string>(
            'auth.refresh_token_expires_in',
            '7d',
          ),
        ),
        same_site,
        secure,
      ),
    );
  }

  private clear_auth_cookies(response: Response): void {
    const same_site = this.config_service.get<'lax' | 'strict' | 'none'>(
      'auth.cookie_same_site',
      'none',
    );
    const secure = this.config_service.get<boolean>('auth.cookie_secure', true);

    response.clearCookie(
      this.config_service.get<string>(
        'auth.access_cookie_name',
        'ff_access_token',
      ),
      {
        httpOnly: true,
        path: '/',
        sameSite: same_site,
        secure,
      },
    );
    response.clearCookie(
      this.config_service.get<string>(
        'auth.refresh_cookie_name',
        'ff_refresh_token',
      ),
      {
        httpOnly: true,
        path: '/',
        sameSite: same_site,
        secure,
      },
    );
  }

  private sanitize_authenticated_user(
    current_user: AuthenticatedUserContext,
  ): Omit<AuthenticatedUserContext, 'session_id'> {
    return this.strip_session_id(current_user);
  }

  private strip_session_id({
    session_id,
    ...safe_user
  }: AuthenticatedUserContext): Omit<AuthenticatedUserContext, 'session_id'> {
    void session_id;
    return safe_user;
  }
}
