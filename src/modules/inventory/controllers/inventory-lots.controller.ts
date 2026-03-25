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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { CreateInventoryLotDto } from '../dto/create-inventory-lot.dto';
import { UpdateInventoryLotDto } from '../dto/update-inventory-lot.dto';
import { InventoryLotsService } from '../services/inventory-lots.service';

@ApiTags('inventory-lots')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('inventory-lots')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class InventoryLotsController {
  constructor(private readonly inventory_lots_service: InventoryLotsService) {}

  @Get()
  @RequirePermissions(PermissionKey.INVENTORY_LOTS_VIEW)
  @ApiOperation({ summary: 'Listar lotes de inventario (paginado)' })
  get_lots(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.inventory_lots_service.get_lots_paginated(current_user, query);
  }

  @Get('cursor')
  @RequirePermissions(PermissionKey.INVENTORY_LOTS_VIEW)
  @ApiOperation({ summary: 'Listar lotes de inventario (cursor)' })
  get_lots_cursor(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: CursorQueryDto,
  ) {
    return this.inventory_lots_service.get_lots_cursor(current_user, query);
  }

  @Post()
  @RequirePermissions(PermissionKey.INVENTORY_LOTS_CREATE)
  @ApiOperation({ summary: 'Crear lote de inventario' })
  @ApiBody({ type: CreateInventoryLotDto })
  create_lot(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateInventoryLotDto,
  ) {
    return this.inventory_lots_service.create_lot(current_user, dto);
  }

  @Get(':inventory_lot_id')
  @RequirePermissions(PermissionKey.INVENTORY_LOTS_VIEW)
  @ApiOperation({ summary: 'Obtener lote por id' })
  @ApiParam({ name: 'inventory_lot_id', type: Number })
  get_lot(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('inventory_lot_id', ParseIntPipe) lot_id: number,
  ) {
    return this.inventory_lots_service.get_lot(current_user, lot_id);
  }

  @Patch(':inventory_lot_id')
  @RequirePermissions(PermissionKey.INVENTORY_LOTS_UPDATE)
  @ApiOperation({ summary: 'Actualizar lote de inventario' })
  @ApiParam({ name: 'inventory_lot_id', type: Number })
  @ApiBody({ type: UpdateInventoryLotDto })
  update_lot(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('inventory_lot_id', ParseIntPipe) lot_id: number,
    @Body() dto: UpdateInventoryLotDto,
  ) {
    return this.inventory_lots_service.update_lot(current_user, lot_id, dto);
  }

  @Delete(':inventory_lot_id')
  @RequirePermissions(PermissionKey.INVENTORY_LOTS_DELETE)
  @ApiOperation({ summary: 'Desactivar lote de inventario (soft delete)' })
  @ApiParam({ name: 'inventory_lot_id', type: Number })
  deactivate_lot(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('inventory_lot_id', ParseIntPipe) lot_id: number,
  ) {
    return this.inventory_lots_service.deactivate_lot(current_user, lot_id);
  }
}
