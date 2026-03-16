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
  Get,
  Param,
  ParseIntPipe,
  Patch,
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
import { UpdateWarehouseLocationDto } from '../dto/update-warehouse-location.dto';
import { WarehousesService } from '../services/warehouses.service';

@ApiTags('warehouse-locations')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('warehouse-locations')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class WarehouseLocationsController {
  constructor(private readonly warehouses_service: WarehousesService) {}

  @Get(':id')
  @RequirePermissions(PermissionKey.WAREHOUSE_LOCATIONS_VIEW)
  @ApiOperation({ summary: 'Obtener ubicacion por id' })
  @ApiParam({ name: 'id', type: Number })
  get_location(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) location_id: number,
  ) {
    return this.warehouses_service.get_location(current_user, location_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.WAREHOUSE_LOCATIONS_UPDATE)
  @ApiOperation({ summary: 'Actualizar ubicacion de bodega' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWarehouseLocationDto })
  update_location(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) location_id: number,
    @Body() dto: UpdateWarehouseLocationDto,
  ) {
    return this.warehouses_service.update_location(
      current_user,
      location_id,
      dto,
    );
  }
}
