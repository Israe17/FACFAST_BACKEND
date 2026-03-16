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
import { CreateProductDto } from '../dto/create-product.dto';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';
import { UpdateProductDto } from '../dto/update-product.dto';
import { PricingService } from '../services/pricing.service';
import { ProductsService } from '../services/products.service';

@ApiTags('products')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('products')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductsController {
  constructor(
    private readonly products_service: ProductsService,
    private readonly pricing_service: PricingService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Listar productos y servicios' })
  get_products(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.products_service.get_products(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Crear producto o servicio' })
  @ApiBody({ type: CreateProductDto })
  create_product(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateProductDto,
  ) {
    return this.products_service.create_product(current_user, dto);
  }

  @Get(':id/prices')
  @RequirePermissions(PermissionKey.PRODUCT_PRICES_VIEW)
  @ApiOperation({ summary: 'Listar precios de un producto' })
  @ApiParam({ name: 'id', type: Number })
  get_product_prices(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
  ) {
    return this.pricing_service.get_product_prices(current_user, product_id);
  }

  @Post(':id/prices')
  @RequirePermissions(PermissionKey.PRODUCT_PRICES_CREATE)
  @ApiOperation({ summary: 'Crear precio para un producto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateProductPriceDto })
  create_product_price(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
    @Body() dto: CreateProductPriceDto,
  ) {
    return this.pricing_service.create_product_price(
      current_user,
      product_id,
      dto,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Obtener producto por id' })
  @ApiParam({ name: 'id', type: Number })
  get_product(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
  ) {
    return this.products_service.get_product(current_user, product_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Actualizar producto o servicio' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateProductDto })
  update_product(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
    @Body() dto: UpdateProductDto,
  ) {
    return this.products_service.update_product(current_user, product_id, dto);
  }
}
