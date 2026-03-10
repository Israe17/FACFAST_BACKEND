import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { InventoryMovementsService } from '../services/inventory-movements.service';

@ApiTags('inventory-movements')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('inventory-movements')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryMovementsController {
  constructor(
    private readonly inventory_movements_service: InventoryMovementsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.INVENTORY_MOVEMENTS_VIEW)
  @ApiOperation({ summary: 'Listar movimientos de inventario' })
  get_movements(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.inventory_movements_service.get_movements(current_user);
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
}
