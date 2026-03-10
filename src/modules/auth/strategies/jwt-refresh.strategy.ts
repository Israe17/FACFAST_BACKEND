import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtRefreshPayload } from '../../common/interfaces/jwt-refresh-payload.interface';
import { UsersService } from '../../users/services/users.service';
import type { RefreshSessionUser } from '../interfaces/refresh-session-user.interface';
import { extract_cookie_token } from '../utils/cookie-extractor.util';

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(
  Strategy,
  'jwt-refresh',
) {
  constructor(
    config_service: ConfigService,
    private readonly users_service: UsersService,
  ) {
    const refresh_cookie_name = config_service.get<string>(
      'auth.refresh_cookie_name',
      'ff_refresh_token',
    );

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (request: Request) =>
          extract_cookie_token(request, refresh_cookie_name),
      ]),
      ignoreExpiration: false,
      secretOrKey: config_service.getOrThrow<string>(
        'auth.refresh_token_secret',
      ),
    });
  }

  async validate(payload: JwtRefreshPayload): Promise<RefreshSessionUser> {
    const authenticated_user =
      await this.users_service.get_authenticated_context(
        payload.sub,
        payload.business_id,
        true,
      );
    if (!authenticated_user) {
      throw new UnauthorizedException('Invalid refresh token payload.');
    }

    return {
      ...authenticated_user,
      session_id: payload.session_id,
    };
  }
}
