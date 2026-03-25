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
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';
import { PricingService } from '../services/pricing.service';

@ApiTags('product-prices')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('product-prices')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductPricesController {
  constructor(private readonly pricing_service: PricingService) {}

  @Get(':product_price_id')
  @RequirePermissions(PermissionKey.PRODUCT_PRICES_VIEW)
  @ApiOperation({ summary: 'Obtener precio de producto por id' })
  @ApiParam({ name: 'product_price_id', type: Number })
  get_product_price(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_price_id', ParseIntPipe) product_price_id: number,
  ) {
    return this.pricing_service.get_product_price(
      current_user,
      product_price_id,
    );
  }

  @Patch(':product_price_id')
  @RequirePermissions(PermissionKey.PRODUCT_PRICES_UPDATE)
  @ApiOperation({ summary: 'Actualizar precio de producto' })
  @ApiParam({ name: 'product_price_id', type: Number })
  @ApiBody({ type: UpdateProductPriceDto })
  update_product_price(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_price_id', ParseIntPipe) product_price_id: number,
    @Body() dto: UpdateProductPriceDto,
  ) {
    return this.pricing_service.update_product_price(
      current_user,
      product_price_id,
      dto,
    );
  }

  @Delete(':product_price_id')
  @RequirePermissions(PermissionKey.PRODUCT_PRICES_DELETE)
  @ApiOperation({ summary: 'Eliminar precio de producto' })
  @ApiParam({ name: 'product_price_id', type: Number })
  delete_product_price(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('product_price_id', ParseIntPipe) product_price_id: number,
  ) {
    return this.pricing_service.delete_product_price(
      current_user,
      product_price_id,
    );
  }
}
