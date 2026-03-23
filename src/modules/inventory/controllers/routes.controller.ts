import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateRouteDto } from '../dto/create-route.dto';
import { UpdateRouteDto } from '../dto/update-route.dto';
import { RoutesService } from '../services/routes.service';

@ApiTags('routes')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('routes')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class RoutesController {
  constructor(private readonly routes_service: RoutesService) {}

  @Get()
  @RequirePermissions(PermissionKey.ROUTES_VIEW)
  @ApiOperation({ summary: 'Listar rutas' })
  get_routes(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.routes_service.get_routes(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.ROUTES_CREATE)
  @ApiOperation({ summary: 'Crear ruta' })
  @ApiBody({ type: CreateRouteDto })
  create_route(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateRouteDto,
  ) {
    return this.routes_service.create_route(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.ROUTES_VIEW)
  @ApiOperation({ summary: 'Obtener ruta por id' })
  @ApiParam({ name: 'id', type: Number })
  get_route(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) route_id: number,
  ) {
    return this.routes_service.get_route(current_user, route_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.ROUTES_UPDATE)
  @ApiOperation({ summary: 'Actualizar ruta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRouteDto })
  update_route(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) route_id: number,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routes_service.update_route(current_user, route_id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.ROUTES_DELETE)
  @ApiOperation({ summary: 'Eliminar ruta' })
  @ApiParam({ name: 'id', type: Number })
  delete_route(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) route_id: number,
  ) {
    return this.routes_service.delete_route(current_user, route_id);
  }
}
