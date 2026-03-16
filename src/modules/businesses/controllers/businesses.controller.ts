import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UpdateCurrentBusinessDto } from '../dto/update-current-business.dto';
import { BusinessesService } from '../services/businesses.service';

@ApiTags('businesses')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('businesses')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class BusinessesController {
  constructor(private readonly businesses_service: BusinessesService) {}

  @Get('current')
  @RequirePermissions(PermissionKey.BUSINESSES_VIEW)
  @ApiOperation({
    summary: 'Obtener la empresa actual del usuario autenticado',
  })
  @ApiOkResponse({ description: 'Detalle de la empresa actual.' })
  get_current_business(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.businesses_service.get_current_business(current_user);
  }

  @Patch('current')
  @RequirePermissions(PermissionKey.BUSINESSES_UPDATE)
  @ApiOperation({
    summary: 'Actualizar la empresa actual del usuario autenticado',
  })
  @ApiBody({ type: UpdateCurrentBusinessDto })
  @ApiOkResponse({ description: 'Empresa actualizada exitosamente.' })
  update_current_business(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: UpdateCurrentBusinessDto,
  ) {
    return this.businesses_service.update_current_business(current_user, dto);
  }
}
