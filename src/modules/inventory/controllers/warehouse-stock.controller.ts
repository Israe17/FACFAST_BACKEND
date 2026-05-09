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
import { UpdateWarehouseStockThresholdsDto } from '../dto/update-warehouse-stock-thresholds.dto';
import { WarehouseStockService } from '../services/warehouse-stock.service';
import { UpdateWarehouseStockThresholdsUseCase } from '../use-cases/update-warehouse-stock-thresholds.use-case';

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
    private readonly update_warehouse_stock_thresholds_use_case: UpdateWarehouseStockThresholdsUseCase,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_VIEW)
  @ApiOperation({ summary: 'Listar stock por bodega accesible' })
  get_stock(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.warehouse_stock_service.get_stock(current_user);
  }

  @Get('cursor')
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_VIEW)
  @ApiOperation({ summary: 'Listar stock por bodega accesible (cursor)' })
  get_stock_cursor(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: CursorQueryDto,
  ) {
    return this.warehouse_stock_service.get_stock_cursor(current_user, query);
  }

  @Get(':warehouse_id/products/cursor')
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_VIEW)
  @ApiOperation({ summary: 'Listar stock de productos por bodega (cursor)' })
  @ApiParam({ name: 'warehouse_id', type: Number })
  get_stock_by_warehouse_cursor(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('warehouse_id', ParseIntPipe) warehouse_id: number,
    @Query() query: CursorQueryDto,
  ) {
    return this.warehouse_stock_service.get_stock_by_warehouse_cursor(
      current_user,
      warehouse_id,
      query,
    );
  }

  @Get(':warehouse_id/products')
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_VIEW)
  @ApiOperation({ summary: 'Listar stock de productos por bodega' })
  @ApiParam({ name: 'warehouse_id', type: Number })
  get_stock_by_warehouse(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('warehouse_id', ParseIntPipe) warehouse_id: number,
  ) {
    return this.warehouse_stock_service.get_stock_by_warehouse(
      current_user,
      warehouse_id,
    );
  }

  @Patch(':warehouse_id/variants/:variant_id/thresholds')
  @RequirePermissions(PermissionKey.WAREHOUSE_STOCK_UPDATE)
  @ApiOperation({
    summary: 'Actualizar minimos y maximos de stock por bodega y variante',
  })
  @ApiParam({ name: 'warehouse_id', type: Number })
  @ApiParam({ name: 'variant_id', type: Number })
  @ApiBody({ type: UpdateWarehouseStockThresholdsDto })
  update_thresholds(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('warehouse_id', ParseIntPipe) warehouse_id: number,
    @Param('variant_id', ParseIntPipe) variant_id: number,
    @Body() dto: UpdateWarehouseStockThresholdsDto,
  ) {
    return this.update_warehouse_stock_thresholds_use_case.execute({
      current_user,
      warehouse_id,
      product_variant_id: variant_id,
      dto,
    });
  }
}
