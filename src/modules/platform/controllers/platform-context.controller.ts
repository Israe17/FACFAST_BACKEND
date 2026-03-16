import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EnterBusinessContextDto } from '../dto/enter-business-context.dto';
import { PlatformContextService } from '../services/platform-context.service';

@ApiTags('platform')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({
  description: 'Privilegios de platform super admin requeridos.',
})
@Controller('platform')
@UseGuards(JwtAuthGuard, PlatformAdminGuard)
export class PlatformContextController {
  constructor(
    private readonly platform_context_service: PlatformContextService,
  ) {}

  @Post('enter-business-context')
  @ApiOperation({
    summary: 'Entrar a un contexto operativo tenant para un platform admin',
  })
  @ApiBody({ type: EnterBusinessContextDto })
  @ApiOkResponse({
    description:
      'Activa acting_business_id y acting_branch_id en la sesion actual.',
  })
  enter_business_context(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: EnterBusinessContextDto,
  ) {
    return this.platform_context_service.enter_business_context(
      current_user,
      dto,
    );
  }

  @Post('clear-business-context')
  @ApiOperation({
    summary: 'Limpiar el contexto operativo tenant de un platform admin',
  })
  @ApiOkResponse({
    description:
      'Limpia acting_business_id y acting_branch_id de la sesion actual.',
  })
  clear_business_context(
    @CurrentUser() current_user: AuthenticatedUserContext,
  ) {
    return this.platform_context_service.clear_business_context(current_user);
  }
}
