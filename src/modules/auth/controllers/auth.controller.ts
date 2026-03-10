import {
  ApiBody,
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RefreshTokenGuard } from '../../common/guards/refresh-token.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { LoginDto } from '../dto/login.dto';
import type { RefreshSessionUser } from '../interfaces/refresh-session-user.interface';
import { AuthService } from '../services/auth.service';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth_service: AuthService,
    private readonly config_service: ConfigService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Iniciar sesion' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description:
      'Login exitoso. Setea cookies HttpOnly y devuelve el contexto autenticado.',
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales invalidas.' })
  login(
    @Body() dto: LoginDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.auth_service.login(dto, request, response);
  }

  @Post('refresh')
  @HttpCode(200)
  @UseGuards(RefreshTokenGuard)
  @ApiOperation({ summary: 'Rotar refresh token' })
  @ApiCookieAuth('refresh-cookie')
  @ApiOkResponse({
    description:
      'Refresh exitoso. Rota la sesion y vuelve a setear access/refresh cookies.',
  })
  @ApiUnauthorizedResponse({
    description: 'Refresh token invalido o expirado.',
  })
  refresh(
    @CurrentUser() current_user: RefreshSessionUser,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refresh_cookie_name = this.config_service.get<string>(
      'auth.refresh_cookie_name',
      'ff_refresh_token',
    );
    const refresh_token = request.cookies?.[refresh_cookie_name] as
      | string
      | undefined;
    return this.auth_service.refresh(
      current_user,
      refresh_token ?? '',
      request,
      response,
    );
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Cerrar sesion' })
  @ApiCookieAuth('refresh-cookie')
  @ApiOkResponse({
    description:
      'Revoca la sesion actual y limpia las cookies de autenticacion.',
  })
  logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    return this.auth_service.logout(request, response);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener usuario autenticado actual' })
  @ApiCookieAuth('access-cookie')
  @ApiOkResponse({
    description:
      'Devuelve el contexto autenticado resuelto con roles, permisos y branch_ids.',
  })
  @ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
  get_me(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.auth_service.get_me(current_user);
  }
}
