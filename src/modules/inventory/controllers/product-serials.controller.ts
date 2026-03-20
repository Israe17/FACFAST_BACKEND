import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
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
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { SerialStatus } from '../enums/serial-status.enum';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { ProductVariantsService } from '../services/product-variants.service';
import { ProductSerialsService } from '../services/product-serials.service';

@ApiTags('product-serials')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller()
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductSerialsController {
  constructor(
    private readonly product_serials_service: ProductSerialsService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  @Post('products/:id/variants/:variantId/serials')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_CREATE)
  @ApiOperation({ summary: 'Registrar seriales en lote' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'variantId', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        serial_numbers: { type: 'array', items: { type: 'string' } },
        warehouse_id: { type: 'number' },
      },
    },
  })
  async register_serials(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
    @Param('variantId', ParseIntPipe) variant_id: number,
    @Body() body: { serial_numbers: string[]; warehouse_id: number },
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        product_id,
      );
    const variant = await this.product_variants_service.get_variant(
      business_id,
      variant_id,
    );
    this.inventory_validation_service.assert_variant_belongs_to_product(
      product,
      variant,
    );
    const serials = await this.product_serials_service.register_serials(
      current_user,
      variant_id,
      body.serial_numbers,
      body.warehouse_id,
      current_user.id,
    );
    return serials.map((s) => this.product_serials_service.serialize_serial(s));
  }

  @Get('products/:id/variants/:variantId/serials')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Listar seriales de una variante' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'variantId', type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SerialStatus })
  @ApiQuery({ name: 'warehouse_id', required: false, type: Number })
  async list_serials(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
    @Param('variantId', ParseIntPipe) variant_id: number,
    @Query('status') status?: SerialStatus,
    @Query('warehouse_id') warehouse_id?: string,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        product_id,
      );
    const variant = await this.product_variants_service.get_variant(
      business_id,
      variant_id,
    );
    this.inventory_validation_service.assert_variant_belongs_to_product(
      product,
      variant,
    );
    const serials = await this.product_serials_service.list_serials(
      current_user,
      variant_id,
      {
        status,
        warehouse_id: warehouse_id ? Number(warehouse_id) : undefined,
      },
    );
    return serials.map((s) => this.product_serials_service.serialize_serial(s));
  }

  @Get('product-serials/lookup')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Buscar serial por número (scan)' })
  @ApiQuery({ name: 'serial_number', type: String })
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

  @Get('product-serials/:id/history')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Historial de eventos de un serial' })
  @ApiParam({ name: 'id', type: Number })
  async get_serial_history(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) serial_id: number,
  ) {
    const { serial, events } =
      await this.product_serials_service.get_serial_history(
        current_user,
        serial_id,
      );
    return {
      serial: this.product_serials_service.serialize_serial(serial),
      events: events.map((e) =>
        this.product_serials_service.serialize_event(e),
      ),
    };
  }

  @Patch('product-serials/:id')
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_UPDATE)
  @ApiOperation({ summary: 'Actualizar estado de un serial' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: Object.values(SerialStatus) },
        notes: { type: 'string', nullable: true },
      },
    },
  })
  async update_serial_status(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) serial_id: number,
    @Body() body: { status: SerialStatus; notes?: string },
  ) {
    const serial = await this.product_serials_service.update_serial_status(
      current_user,
      serial_id,
      body.status,
      body.notes ?? null,
      current_user.id,
    );
    return this.product_serials_service.serialize_serial(serial);
  }
}
