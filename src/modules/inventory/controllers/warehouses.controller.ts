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
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateWarehouseLocationDto } from '../dto/create-warehouse-location.dto';
import { CreateWarehouseDto } from '../dto/create-warehouse.dto';
import { UpdateWarehouseDto } from '../dto/update-warehouse.dto';
import { WarehousesService } from '../services/warehouses.service';

@ApiTags('warehouses')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('warehouses')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WarehousesController {
  constructor(private readonly warehouses_service: WarehousesService) {}

  @Get()
  @RequirePermissions(PermissionKey.WAREHOUSES_VIEW)
  @ApiOperation({ summary: 'Listar bodegas accesibles' })
  get_warehouses(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.warehouses_service.get_warehouses(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.WAREHOUSES_CREATE)
  @ApiOperation({ summary: 'Crear bodega' })
  @ApiBody({ type: CreateWarehouseDto })
  create_warehouse(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateWarehouseDto,
  ) {
    return this.warehouses_service.create_warehouse(current_user, dto);
  }

  @Get(':id/locations')
  @RequirePermissions(PermissionKey.WAREHOUSE_LOCATIONS_VIEW)
  @ApiOperation({ summary: 'Listar ubicaciones de una bodega' })
  @ApiParam({ name: 'id', type: Number })
  get_locations(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warehouse_id: number,
  ) {
    return this.warehouses_service.get_locations(current_user, warehouse_id);
  }

  @Post(':id/locations')
  @RequirePermissions(PermissionKey.WAREHOUSE_LOCATIONS_CREATE)
  @ApiOperation({ summary: 'Crear ubicacion dentro de una bodega' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateWarehouseLocationDto })
  create_location(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warehouse_id: number,
    @Body() dto: CreateWarehouseLocationDto,
  ) {
    return this.warehouses_service.create_location(
      current_user,
      warehouse_id,
      dto,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.WAREHOUSES_VIEW)
  @ApiOperation({ summary: 'Obtener bodega por id' })
  @ApiParam({ name: 'id', type: Number })
  get_warehouse(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warehouse_id: number,
  ) {
    return this.warehouses_service.get_warehouse(current_user, warehouse_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.WAREHOUSES_UPDATE)
  @ApiOperation({ summary: 'Actualizar bodega' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWarehouseDto })
  update_warehouse(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warehouse_id: number,
    @Body() dto: UpdateWarehouseDto,
  ) {
    return this.warehouses_service.update_warehouse(
      current_user,
      warehouse_id,
      dto,
    );
  }
}
