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
import { RegisterProductSerialsDto } from '../dto/register-product-serials.dto';
import { SerialStatus } from '../enums/serial-status.enum';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { ProductSerialsService } from '../services/product-serials.service';
import { ProductVariantsService } from '../services/product-variants.service';

@ApiTags('product-serials')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('products/:product_id/variants/:variant_id/serials')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductVariantSerialsController {
  constructor(
    private readonly product_serials_service: ProductSerialsService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  @Post()
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_CREATE)
  @ApiOperation({ summary: 'Registrar seriales en lote' })
  @ApiParam({ name: 'product_id', type: Number })
  @ApiParam({ name: 'variant_id', type: Number })
  @ApiBody({ type: RegisterProductSerialsDto })
  async register_serials(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_id', ParseIntPipe) product_id: number,
    @Param('variant_id', ParseIntPipe) variant_id: number,
    @Body() dto: RegisterProductSerialsDto,
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
      dto.serial_numbers,
      dto.warehouse_id,
      current_user.id,
    );
    return serials.map((serial) =>
      this.product_serials_service.serialize_serial(serial),
    );
  }

  @Get()
  @RequirePermissions(PermissionKey.PRODUCT_SERIALS_VIEW)
  @ApiOperation({ summary: 'Listar seriales de una variante' })
  @ApiParam({ name: 'product_id', type: Number })
  @ApiParam({ name: 'variant_id', type: Number })
  @ApiQuery({ name: 'status', required: false, enum: SerialStatus })
  @ApiQuery({ name: 'warehouse_id', required: false, type: Number })
  async list_serials(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_id', ParseIntPipe) product_id: number,
    @Param('variant_id', ParseIntPipe) variant_id: number,
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
    return serials.map((serial) =>
      this.product_serials_service.serialize_serial(serial),
    );
  }
}
