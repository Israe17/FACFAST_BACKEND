import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { WarehouseStockService } from '../services/warehouse-stock.service';

@ApiTags('warehouse-stock')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('warehouse-stock')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class WarehouseStockController {
  constructor(
    private readonly warehouse_stock_service: WarehouseStockService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_VIEW)
  @ApiOperation({ summary: 'Listar stock por bodega accesible' })
  get_stock(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.warehouse_stock_service.get_stock(current_user);
  }

  @Get(':warehouseId/products')
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_VIEW)
  @ApiOperation({ summary: 'Listar stock de productos por bodega' })
  @ApiParam({ name: 'warehouseId', type: Number })
  get_stock_by_warehouse(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('warehouseId', ParseIntPipe) warehouse_id: number,
  ) {
    return this.warehouse_stock_service.get_stock_by_warehouse(
      current_user,
      warehouse_id,
    );
  }
}
