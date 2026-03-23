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
import { CreateDispatchOrderDto } from '../dto/create-dispatch-order.dto';
import { UpdateDispatchOrderDto } from '../dto/update-dispatch-order.dto';
import { CreateDispatchStopDto } from '../dto/create-dispatch-stop.dto';
import { CreateDispatchExpenseDto } from '../dto/create-dispatch-expense.dto';
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
  ) {
    return this.dispatch_orders_service.get_dispatch_orders(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_CREATE)
  @ApiOperation({ summary: 'Crear orden de despacho' })
  @ApiBody({ type: CreateDispatchOrderDto })
  create_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateDispatchOrderDto,
  ) {
    return this.dispatch_orders_service.create_dispatch_order(
      current_user,
      dto,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_VIEW)
  @ApiOperation({ summary: 'Obtener orden de despacho por id' })
  @ApiParam({ name: 'id', type: Number })
  get_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.dispatch_orders_service.get_dispatch_order(current_user, id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Actualizar orden de despacho' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateDispatchOrderDto })
  update_dispatch_order(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateDispatchOrderDto,
  ) {
    return this.dispatch_orders_service.update_dispatch_order(
      current_user,
      id,
      dto,
    );
  }

  @Post(':id/stops')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Agregar parada a orden de despacho' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateDispatchStopDto })
  add_stop(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDispatchStopDto,
  ) {
    return this.dispatch_orders_service.add_stop(current_user, id, dto);
  }

  @Delete(':id/stops/:stopId')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Eliminar parada de orden de despacho' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'stopId', type: Number })
  remove_stop(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('stopId', ParseIntPipe) stop_id: number,
  ) {
    return this.dispatch_orders_service.remove_stop(
      current_user,
      id,
      stop_id,
    );
  }

  @Post(':id/expenses')
  @RequirePermissions(PermissionKey.DISPATCH_EXPENSES_CREATE)
  @ApiOperation({ summary: 'Agregar gasto a orden de despacho' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateDispatchExpenseDto })
  add_expense(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateDispatchExpenseDto,
  ) {
    return this.dispatch_orders_service.add_expense(current_user, id, dto);
  }

  @Delete(':id/expenses/:expenseId')
  @RequirePermissions(PermissionKey.DISPATCH_EXPENSES_DELETE)
  @ApiOperation({ summary: 'Eliminar gasto de orden de despacho' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'expenseId', type: Number })
  remove_expense(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
    @Param('expenseId', ParseIntPipe) expense_id: number,
  ) {
    return this.dispatch_orders_service.remove_expense(
      current_user,
      id,
      expense_id,
    );
  }

  @Post(':id/dispatch')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Marcar orden como despachada' })
  @ApiParam({ name: 'id', type: Number })
  mark_dispatched(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.dispatch_orders_service.mark_dispatched(current_user, id);
  }

  @Post(':id/complete')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_UPDATE)
  @ApiOperation({ summary: 'Marcar orden como completada' })
  @ApiParam({ name: 'id', type: Number })
  mark_completed(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.dispatch_orders_service.mark_completed(current_user, id);
  }

  @Post(':id/cancel')
  @RequirePermissions(PermissionKey.DISPATCH_ORDERS_CANCEL)
  @ApiOperation({ summary: 'Cancelar orden de despacho' })
  @ApiParam({ name: 'id', type: Number })
  cancel_dispatch(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.dispatch_orders_service.cancel_dispatch(current_user, id);
  }
}
