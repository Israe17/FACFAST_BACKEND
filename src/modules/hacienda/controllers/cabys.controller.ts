import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { CabysService } from '../services/cabys.service';

@ApiTags('cabys')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('cabys')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class CabysController {
  constructor(private readonly cabys_service: CabysService) {}

  @Get('search')
  @RequirePermissions(PermissionKey.CATEGORIES_VIEW)
  @ApiOperation({
    summary: 'Buscar en el catalogo CABYS de Hacienda',
  })
  @ApiQuery({ name: 'q', required: true, description: 'Texto de busqueda (minimo 3 caracteres)' })
  @ApiQuery({ name: 'top', required: false, description: 'Limite de resultados' })
  @ApiOkResponse({ description: 'Resultados de busqueda CABYS.' })
  search_cabys(
    @Query('q') query: string,
    @Query('top') top?: string,
  ) {
    return this.cabys_service.search(query, Number(top) || 10);
  }
}
