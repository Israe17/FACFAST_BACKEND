import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('rbac')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('permissions')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissions_service: PermissionsService) {}

  // Open to any authenticated user: this is metadata (the catalog of
  // permission keys defined in the system). Knowing that a permission
  // exists does not grant it. The frontend uses this list to validate
  // that can() / canAny() / canAll() inputs reference real permissions
  // — typos there silently return false, which is exactly the kind of
  // bug we want to surface in development. Per-user authorization is
  // still enforced by the backend on every concrete operation.
  @Get()
  @ApiOperation({ summary: 'Listar permisos del sistema' })
  @ApiOkResponse({ description: 'Lista de permisos base disponibles.' })
  get_permissions() {
    return this.permissions_service.find_all();
  }
}
