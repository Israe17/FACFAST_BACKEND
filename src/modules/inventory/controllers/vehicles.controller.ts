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
import { CreateVehicleDto } from '../dto/create-vehicle.dto';
import { UpdateVehicleDto } from '../dto/update-vehicle.dto';
import { VehiclesService } from '../services/vehicles.service';

@ApiTags('vehicles')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('vehicles')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class VehiclesController {
  constructor(private readonly vehicles_service: VehiclesService) {}

  @Get()
  @RequirePermissions(PermissionKey.VEHICLES_VIEW)
  @ApiOperation({ summary: 'Listar vehículos' })
  get_vehicles(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.vehicles_service.get_vehicles(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.VEHICLES_CREATE)
  @ApiOperation({ summary: 'Crear vehículo' })
  @ApiBody({ type: CreateVehicleDto })
  create_vehicle(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateVehicleDto,
  ) {
    return this.vehicles_service.create_vehicle(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.VEHICLES_VIEW)
  @ApiOperation({ summary: 'Obtener vehículo por id' })
  @ApiParam({ name: 'id', type: Number })
  get_vehicle(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) vehicle_id: number,
  ) {
    return this.vehicles_service.get_vehicle(current_user, vehicle_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.VEHICLES_UPDATE)
  @ApiOperation({ summary: 'Actualizar vehículo' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateVehicleDto })
  update_vehicle(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) vehicle_id: number,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles_service.update_vehicle(current_user, vehicle_id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.VEHICLES_DELETE)
  @ApiOperation({ summary: 'Eliminar vehículo' })
  @ApiParam({ name: 'id', type: Number })
  delete_vehicle(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) vehicle_id: number,
  ) {
    return this.vehicles_service.delete_vehicle(current_user, vehicle_id);
  }
}
