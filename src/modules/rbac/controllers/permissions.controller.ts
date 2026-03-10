import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Controller, Get, UseGuards } from '@nestjs/common';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { PermissionsService } from '../services/permissions.service';

@ApiTags('rbac')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('permissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PermissionsController {
  constructor(private readonly permissions_service: PermissionsService) {}

  @Get()
  @RequirePermissions('permissions.view')
  @ApiOperation({ summary: 'Listar permisos' })
  @ApiOkResponse({ description: 'Lista de permisos base disponibles.' })
  get_permissions() {
    return this.permissions_service.find_all();
  }
}
