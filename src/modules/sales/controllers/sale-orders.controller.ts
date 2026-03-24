import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
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
import { CancelSaleOrderDto } from '../dto/cancel-sale-order.dto';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from '../dto/update-sale-order.dto';
import { SaleOrdersService } from '../services/sale-orders.service';

@ApiTags('sale-orders')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('sale-orders')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class SaleOrdersController {
  constructor(private readonly sale_orders_service: SaleOrdersService) {}

  @Get()
  @RequirePermissions(PermissionKey.SALE_ORDERS_VIEW)
  @ApiOperation({
    summary: 'Listar ordenes de venta del negocio autenticado (paginado)',
  })
  @ApiOkResponse({ description: 'Lista paginada de ordenes de venta.' })
  get_sale_orders(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.sale_orders_service.get_sale_orders_paginated(
      current_user,
      query,
    );
  }

  @Post()
  @RequirePermissions(PermissionKey.SALE_ORDERS_CREATE)
  @ApiOperation({ summary: 'Crear orden de venta' })
  @ApiBody({ type: CreateSaleOrderDto })
  @ApiOkResponse({ description: 'Orden de venta creada exitosamente.' })
  create_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateSaleOrderDto,
  ) {
    return this.sale_orders_service.create_sale_order(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.SALE_ORDERS_VIEW)
  @ApiOperation({ summary: 'Obtener orden de venta por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Detalle de la orden de venta.' })
  get_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) order_id: number,
  ) {
    return this.sale_orders_service.get_sale_order(current_user, order_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.SALE_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Actualizar orden de venta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateSaleOrderDto })
  @ApiOkResponse({ description: 'Orden de venta actualizada exitosamente.' })
  update_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) order_id: number,
    @Body() dto: UpdateSaleOrderDto,
  ) {
    return this.sale_orders_service.update_sale_order(
      current_user,
      order_id,
      dto,
    );
  }

  @Post(':id/confirm')
  @RequirePermissions(PermissionKey.SALE_ORDERS_CONFIRM)
  @ApiOperation({ summary: 'Confirmar orden de venta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Orden de venta confirmada exitosamente.' })
  confirm_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) order_id: number,
  ) {
    return this.sale_orders_service.confirm_sale_order(current_user, order_id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionKey.SALE_ORDERS_CANCEL)
  @ApiOperation({ summary: 'Cancelar orden de venta' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CancelSaleOrderDto })
  @ApiOkResponse({ description: 'Orden de venta cancelada exitosamente.' })
  cancel_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) order_id: number,
    @Body() dto: CancelSaleOrderDto,
  ) {
    return this.sale_orders_service.cancel_sale_order(
      current_user,
      order_id,
      dto,
    );
  }
}
