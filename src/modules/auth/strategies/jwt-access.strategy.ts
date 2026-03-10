import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import type { JwtAccessPayload } from '../../common/interfaces/jwt-access-payload.interface';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UsersService } from '../../users/services/users.service';
import { extract_cookie_token } from '../utils/cookie-extractor.util';

@Injectable()
export class JwtAccessStrategy extends PassportStrategy(
  Strategy,
  'jwt-access',
) {
  constructor(
    config_service: ConfigService,
    private readonly users_service: UsersService,
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
    const authenticated_user =
      await this.users_service.get_authenticated_context(
        payload.sub,
        payload.business_id,
        true,
      );
    if (!authenticated_user) {
      throw new UnauthorizedException('Invalid access token payload.');
    }

    return authenticated_user;
  }
}
