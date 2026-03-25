import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
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
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UpdateProductSerialStatusDto } from '../dto/update-product-serial-status.dto';
import { ProductSerialsService } from '../services/product-serials.service';

@ApiTags('product-serials')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('product-serials')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductSerialsController {
  constructor(private readonly product_serials_service: ProductSerialsService) {}

  @Get('lookup')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Buscar serial por numero (scan)' })
  @ApiQuery({ name: 'serial_number', type: String })
  @ApiOkResponse({ description: 'Detalle del serial encontrado.' })
  async lookup_serial(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query('serial_number') serial_number: string,
  ) {
    const serial = await this.product_serials_service.lookup_serial(
      current_user,
      serial_number,
    );
    return this.product_serials_service.serialize_serial(serial);
  }

  @Get(':product_serial_id')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Obtener serial por id' })
  @ApiParam({ name: 'product_serial_id', type: Number })
  @ApiOkResponse({ description: 'Detalle del serial.' })
  async get_serial(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_serial_id', ParseIntPipe) product_serial_id: number,
  ) {
    const serial = await this.product_serials_service.get_serial(
      current_user,
      product_serial_id,
    );
    return this.product_serials_service.serialize_serial(serial);
  }

  @Get(':product_serial_id/history')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Historial de eventos de un serial' })
  @ApiParam({ name: 'product_serial_id', type: Number })
  @ApiOkResponse({ description: 'Historial del serial solicitado.' })
  async get_serial_history(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_serial_id', ParseIntPipe) product_serial_id: number,
  ) {
    const { serial, events } =
      await this.product_serials_service.get_serial_history(
        current_user,
        product_serial_id,
      );
    return {
      serial: this.product_serials_service.serialize_serial(serial),
      events: events.map((event) =>
        this.product_serials_service.serialize_event(event),
      ),
    };
  }

  @Patch(':product_serial_id')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_UPDATE)
  @ApiOperation({ summary: 'Actualizar estado de un serial' })
  @ApiParam({ name: 'product_serial_id', type: Number })
  @ApiBody({ type: UpdateProductSerialStatusDto })
  @ApiOkResponse({ description: 'Serial actualizado exitosamente.' })
  async update_serial_status(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_serial_id', ParseIntPipe) product_serial_id: number,
    @Body() dto: UpdateProductSerialStatusDto,
  ) {
    const serial = await this.product_serials_service.update_serial_status(
      current_user,
      product_serial_id,
      dto.status,
      dto.notes ?? null,
      current_user.id,
    );
    return this.product_serials_service.serialize_serial(serial);
  }
}
