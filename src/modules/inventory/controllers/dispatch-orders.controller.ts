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
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateDispatchOrderDto } from '../dto/create-dispatch-order.dto';
import { UpdateDispatchOrderDto } from '../dto/update-dispatch-order.dto';
import { CreateDispatchStopDto } from '../dto/create-dispatch-stop.dto';
import { CreateDispatchExpenseDto } from '../dto/create-dispatch-expense.dto';
import { UpdateDispatchStopStatusDto } from '../dto/update-dispatch-stop-status.dto';
import { DispatchOrdersService } from '../services/dispatch-orders.service';

@ApiTags('dispatch-orders')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('dispatch-orders')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class DispatchOrdersController {
  constructor(
    private readonly dispatch_orders_service: DispatchOrdersService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_VIEW)
  @ApiOperation({ summary: 'Listar ordenes de despacho' })
  get_dispatch_orders(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: PaginatedQueryDto,
  ) {
    if (query.page || query.limit || query.search || query.sort_by) {
      return this.dispatch_orders_service.get_dispatch_orders_paginated(current_user, query);
    }
    return this.dispatch_orders_service.get_dispatch_orders(current_user);
  }

  @Get('cursor')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_VIEW)
  @ApiOperation({ summary: 'Listar ordenes de despacho (cursor)' })
  get_dispatch_orders_cursor(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: CursorQueryDto,
  ) {
    return this.dispatch_orders_service.get_dispatch_orders_cursor(
      current_user,
      query,
    );
  }

  @Post()
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_CREATE)
  @ApiOperation({ summary: 'Crear orden de despacho' })
  @ApiBody({ type: CreateDispatchOrderDto })
  create_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateDispatchOrderDto,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.create_dispatch_order(
      current_user,
      dto,
      idempotency_key,
    );
  }

  @Get(':dispatch_order_id')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_VIEW)
  @ApiOperation({ summary: 'Obtener orden de despacho por id' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  get_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
  ) {
    return this.dispatch_orders_service.get_dispatch_order(
      current_user,
      dispatch_order_id,
    );
  }

  @Patch(':dispatch_order_id')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Actualizar orden de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  @ApiBody({ type: UpdateDispatchOrderDto })
  update_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @Body() dto: UpdateDispatchOrderDto,
  ) {
    return this.dispatch_orders_service.update_dispatch_order(
      current_user,
      dispatch_order_id,
      dto,
    );
  }

  @Post(':dispatch_order_id/stops')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Agregar parada a orden de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  @ApiBody({ type: CreateDispatchStopDto })
  add_stop(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @Body() dto: CreateDispatchStopDto,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.add_stop(
      current_user,
      dispatch_order_id,
      dto,
      idempotency_key,
    );
  }

  @Delete(':dispatch_order_id/stops/:dispatch_stop_id')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Eliminar parada de orden de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  @ApiParam({ name: 'dispatch_stop_id', type: Number })
  remove_stop(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @Param('dispatch_stop_id', ParseIntPipe) stop_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.remove_stop(
      current_user,
      dispatch_order_id,
      stop_id,
      idempotency_key,
    );
  }

  @Patch(':dispatch_order_id/stops/:dispatch_stop_id/status')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Actualizar estado de parada de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  @ApiParam({ name: 'dispatch_stop_id', type: Number })
  @ApiBody({ type: UpdateDispatchStopStatusDto })
  update_stop_status(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @Param('dispatch_stop_id', ParseIntPipe) dispatch_stop_id: number,
    @Body() dto: UpdateDispatchStopStatusDto,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.update_stop_status(
      current_user,
      dispatch_order_id,
      dispatch_stop_id,
      dto,
      idempotency_key,
    );
  }

  @Post(':dispatch_order_id/expenses')
  @RequirePermissions(PermissionKey.DISPATCH_EXPENSES_CREATE)
  @ApiOperation({ summary: 'Agregar gasto a orden de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  @ApiBody({ type: CreateDispatchExpenseDto })
  add_expense(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @Body() dto: CreateDispatchExpenseDto,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.add_expense(
      current_user,
      dispatch_order_id,
      dto,
      idempotency_key,
    );
  }

  @Delete(':dispatch_order_id/expenses/:dispatch_expense_id')
  @RequirePermissions(PermissionKey.DISPATCH_EXPENSES_DELETE)
  @ApiOperation({ summary: 'Eliminar gasto de orden de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  @ApiParam({ name: 'dispatch_expense_id', type: Number })
  remove_expense(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @Param('dispatch_expense_id', ParseIntPipe) expense_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.remove_expense(
      current_user,
      dispatch_order_id,
      expense_id,
      idempotency_key,
    );
  }

  @Post(':dispatch_order_id/ready')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Marcar orden como lista para despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  mark_ready(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.mark_ready(
      current_user,
      dispatch_order_id,
      idempotency_key,
    );
  }

  @Post(':dispatch_order_id/dispatch')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Marcar orden como despachada' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  mark_dispatched(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.mark_dispatched(
      current_user,
      dispatch_order_id,
      idempotency_key,
    );
  }

  @Post(':dispatch_order_id/complete')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Marcar orden como completada' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  mark_completed(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.mark_completed(
      current_user,
      dispatch_order_id,
      idempotency_key,
    );
  }

  @Post(':dispatch_order_id/cancel')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_CANCEL)
  @ApiOperation({ summary: 'Cancelar orden de despacho' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  cancel_dispatch(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.dispatch_orders_service.cancel_dispatch(
      current_user,
      dispatch_order_id,
      idempotency_key,
    );
  }

  @Delete(':dispatch_order_id')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_DELETE)
  @ApiOperation({ summary: 'Eliminar orden de despacho (solo borradores o canceladas)' })
  @ApiParam({ name: 'dispatch_order_id', type: Number })
  delete_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('dispatch_order_id', ParseIntPipe) dispatch_order_id: number,
  ) {
    return this.dispatch_orders_service.delete_dispatch_order(
      current_user,
      dispatch_order_id,
    );
  }
}
