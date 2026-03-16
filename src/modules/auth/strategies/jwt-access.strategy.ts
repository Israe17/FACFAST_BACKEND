import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-access-payload.interface';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UsersService } from '../../users/services/users.service';
import { RefreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { extract_cookie_token } from '../utils/cookie-extractor.util';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    config_service: ConfigService,
    private readonly users_service: UsersService,
    private readonly refresh_tokens_repository: RefreshTokensRepository,
  ) {
    const access_cookie_name = config_service.get<string>(
      'auth.access_cookie_name',
      'ff_access_token',
    );

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) => extract_cookie_token(request, access_cookie_name),
        ExtractJwt.fromAuthHeaderAsBearerToken(),
      ]),
      ignoreExpiration: false,
      secretOrKey: config_service.getOrThrow<string>(
        'auth.access_token_secret',
      ),
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUserContext> {
    const refresh_session = await this.refresh_tokens_repository.find_by_id(
      payload.session_id,
    );
    if (!refresh_session) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_ACCESS_SESSION_NOT_FOUND',
        messageKey: 'auth.access_session_not_found',
      });
    }
    if (refresh_session.user_id !== payload.sub) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_ACCESS_SESSION_USER_MISMATCH',
        messageKey: 'auth.access_session_user_mismatch',
      });
    }
    if (refresh_session.business_id !== payload.business_id) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_ACCESS_SESSION_BUSINESS_MISMATCH',
        messageKey: 'auth.access_session_business_mismatch',
      });
    }
    if (
      refresh_session.revoked_at ||
      refresh_session.expires_at.getTime() <= Date.now()
    ) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_ACCESS_SESSION_INACTIVE',
        messageKey: 'auth.access_session_inactive',
      });
    }

    const authenticated_user =
      await this.users_service.get_authenticated_context(
        payload.sub,
        payload.business_id,
        true,
        {
          session_id: refresh_session.id,
          acting_business_id: refresh_session.acting_business_id,
          acting_branch_id: refresh_session.acting_branch_id,
        },
      );
    if (!authenticated_user) {
      throw new DomainUnauthorizedException({
        code: 'AUTH_ACCESS_TOKEN_PAYLOAD_INVALID',
        messageKey: 'auth.access_token_payload_invalid',
      });
    }

    return authenticated_user;
  }
}
