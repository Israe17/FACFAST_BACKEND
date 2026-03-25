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
  Put,
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
import { CreateZoneDto } from '../dto/create-zone.dto';
import { SetBranchAssignmentsDto } from '../dto/set-branch-assignments.dto';
import { UpdateZoneDto } from '../dto/update-zone.dto';
import { ZonesService } from '../services/zones.service';

@ApiTags('zones')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('zones')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ZonesController {
  constructor(private readonly zones_service: ZonesService) {}

  @Get()
  @RequirePermissions(PermissionKey.ZONES_VIEW)
  @ApiOperation({ summary: 'Listar zonas' })
  get_zones(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.zones_service.get_zones(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.ZONES_CREATE)
  @ApiOperation({ summary: 'Crear zona' })
  @ApiBody({ type: CreateZoneDto })
  create_zone(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateZoneDto,
  ) {
    return this.zones_service.create_zone(current_user, dto);
  }

  @Get(':zone_id')
  @RequirePermissions(PermissionKey.ZONES_VIEW)
  @ApiOperation({ summary: 'Obtener zona por id' })
  @ApiParam({ name: 'zone_id', type: Number })
  get_zone(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('zone_id', ParseIntPipe) zone_id: number,
  ) {
    return this.zones_service.get_zone(current_user, zone_id);
  }

  @Get(':zone_id/branches')
  @RequirePermissions(PermissionKey.ZONES_VIEW)
  @ApiOperation({ summary: 'Obtener asignacion por sucursales de zona' })
  @ApiParam({ name: 'zone_id', type: Number })
  get_zone_branch_assignments(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('zone_id', ParseIntPipe) zone_id: number,
  ) {
    return this.zones_service.get_zone_branch_assignments(current_user, zone_id);
  }

  @Patch(':zone_id')
  @RequirePermissions(PermissionKey.ZONES_UPDATE)
  @ApiOperation({ summary: 'Actualizar zona' })
  @ApiParam({ name: 'zone_id', type: Number })
  @ApiBody({ type: UpdateZoneDto })
  update_zone(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('zone_id', ParseIntPipe) zone_id: number,
    @Body() dto: UpdateZoneDto,
  ) {
    return this.zones_service.update_zone(current_user, zone_id, dto);
  }

  @Put(':zone_id/branches')
  @RequirePermissions(PermissionKey.ZONES_UPDATE)
  @ApiOperation({ summary: 'Actualizar asignacion por sucursales de zona' })
  @ApiParam({ name: 'zone_id', type: Number })
  @ApiBody({ type: SetBranchAssignmentsDto })
  set_zone_branch_assignments(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('zone_id', ParseIntPipe) zone_id: number,
    @Body() dto: SetBranchAssignmentsDto,
  ) {
    return this.zones_service.set_zone_branch_assignments(
      current_user,
      zone_id,
      dto,
    );
  }

  @Delete(':zone_id')
  @RequirePermissions(PermissionKey.ZONES_DELETE)
  @ApiOperation({ summary: 'Eliminar zona' })
  @ApiParam({ name: 'zone_id', type: Number })
  delete_zone(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('zone_id', ParseIntPipe) zone_id: number,
  ) {
    return this.zones_service.delete_zone(current_user, zone_id);
  }
}
