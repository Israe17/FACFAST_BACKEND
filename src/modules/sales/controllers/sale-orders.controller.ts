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
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { CancelSaleOrderDto } from '../dto/cancel-sale-order.dto';
import { CancelSaleOrderLineDto } from '../dto/cancel-sale-order-line.dto';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import { ResetSaleOrderDispatchDto } from '../dto/reset-sale-order-dispatch.dto';
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

  @Get('cursor')
  @RequirePermissions(PermissionKey.SALE_ORDERS_VIEW)
  @ApiOperation({
    summary: 'Listar ordenes de venta del negocio autenticado (cursor)',
  })
  @ApiOkResponse({ description: 'Lista cursor-first de ordenes de venta.' })
  get_sale_orders_cursor(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: CursorQueryDto,
  ) {
    return this.sale_orders_service.get_sale_orders_cursor(current_user, query);
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

  @Get(':sale_order_id')
  @RequirePermissions(PermissionKey.SALE_ORDERS_VIEW)
  @ApiOperation({ summary: 'Obtener orden de venta por id' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiOkResponse({ description: 'Detalle de la orden de venta.' })
  get_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
  ) {
    return this.sale_orders_service.get_sale_order(current_user, order_id);
  }

  @Patch(':sale_order_id')
  @RequirePermissions(PermissionKey.SALE_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Actualizar orden de venta' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiBody({ type: UpdateSaleOrderDto })
  @ApiOkResponse({ description: 'Orden de venta actualizada exitosamente.' })
  update_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
    @Body() dto: UpdateSaleOrderDto,
  ) {
    return this.sale_orders_service.update_sale_order(
      current_user,
      order_id,
      dto,
    );
  }

  @Post(':sale_order_id/confirm')
  @RequirePermissions(PermissionKey.SALE_ORDERS_CONFIRM)
  @ApiOperation({ summary: 'Confirmar orden de venta' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiOkResponse({ description: 'Orden de venta confirmada exitosamente.' })
  confirm_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.sale_orders_service.confirm_sale_order(
      current_user,
      order_id,
      idempotency_key,
    );
  }

  @Delete(':sale_order_id')
  @RequirePermissions(PermissionKey.SALE_ORDERS_DELETE)
  @ApiOperation({ summary: 'Eliminar orden de venta (solo borradores)' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiOkResponse({ description: 'Orden de venta eliminada exitosamente.' })
  delete_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
  ) {
    return this.sale_orders_service.delete_sale_order(current_user, order_id);
  }

  @Post(':sale_order_id/lines/:line_id/cancel')
  @RequirePermissions(PermissionKey.SALE_ORDERS_CANCEL)
  @ApiOperation({ summary: 'Cancelar linea individual de orden de venta' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiParam({ name: 'line_id', type: Number })
  @ApiBody({ type: CancelSaleOrderLineDto })
  @ApiOkResponse({ description: 'Linea cancelada exitosamente.' })
  cancel_sale_order_line(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
    @Param('line_id', ParseIntPipe) line_id: number,
    @Body() dto: CancelSaleOrderLineDto,
  ) {
    return this.sale_orders_service.cancel_sale_order_line(
      current_user,
      order_id,
      line_id,
      dto,
    );
  }

  @Post(':sale_order_id/cancel')
  @RequirePermissions(PermissionKey.SALE_ORDERS_CANCEL)
  @ApiOperation({ summary: 'Cancelar orden de venta' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiBody({ type: CancelSaleOrderDto })
  @ApiOkResponse({ description: 'Orden de venta cancelada exitosamente.' })
  cancel_sale_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
    @Body() dto: CancelSaleOrderDto,
  ) {
    return this.sale_orders_service.cancel_sale_order(
      current_user,
      order_id,
      dto,
    );
  }

  @Post(':sale_order_id/reset-dispatch')
  @RequirePermissions(PermissionKey.SALE_ORDERS_CONFIRM)
  @ApiOperation({ summary: 'Resetear estado de despacho para re-despacho' })
  @ApiParam({ name: 'sale_order_id', type: Number })
  @ApiOkResponse({ description: 'Estado de despacho reseteado a pendiente.' })
  reset_dispatch_status(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('sale_order_id', ParseIntPipe) order_id: number,
    @Body() dto: ResetSaleOrderDispatchDto,
  ) {
    return this.sale_orders_service.reset_dispatch_status(
      current_user,
      order_id,
      dto,
    );
  }
}
