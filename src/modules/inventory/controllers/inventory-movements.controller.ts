import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
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
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { CancelInventoryMovementDto } from '../dto/cancel-inventory-movement.dto';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { InventoryMovementsService } from '../services/inventory-movements.service';

@ApiTags('inventory-movements')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('inventory-movements')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class InventoryMovementsController {
  constructor(
    private readonly inventory_movements_service: InventoryMovementsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.INVENTORY_MOVEMENTS_VIEW)
  @ApiOperation({ summary: 'Listar movimientos de inventario (paginado)' })
  get_movements(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.inventory_movements_service.get_movements_paginated(
      current_user,
      query,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.INVENTORY_MOVEMENTS_VIEW)
  @ApiOperation({ summary: 'Obtener movimiento de inventario por id' })
  get_movement(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) movement_id: number,
  ) {
    return this.inventory_movements_service.get_movement(
      current_user,
      movement_id,
    );
  }

  @Post('adjust')
  @RequirePermissions(PermissionKey.INVENTORY_MOVEMENTS_ADJUST)
  @ApiOperation({ summary: 'Registrar ajuste manual de inventario' })
  @ApiBody({ type: CreateInventoryAdjustmentDto })
  adjust_inventory(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateInventoryAdjustmentDto,
  ) {
    return this.inventory_movements_service.adjust_inventory(current_user, dto);
  }

  @Post('transfer')
  @RequirePermissions(PermissionKey.INVENTORY_MOVEMENTS_TRANSFER)
  @ApiOperation({ summary: 'Registrar transferencia inmediata entre bodegas' })
  @ApiBody({ type: CreateInventoryTransferDto })
  transfer_inventory(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateInventoryTransferDto,
  ) {
    return this.inventory_movements_service.transfer_inventory(
      current_user,
      dto,
    );
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionKey.INVENTORY_MOVEMENTS_CANCEL)
  @ApiOperation({
    summary:
      'Cancelar un movimiento posteado mediante movimiento compensatorio',
  })
  @ApiBody({ type: CancelInventoryMovementDto, required: false })
  cancel_movement(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) movement_id: number,
    @Body() dto: CancelInventoryMovementDto,
  ) {
    return this.inventory_movements_service.cancel_movement(
      current_user,
      movement_id,
      dto,
    );
  }
}
