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
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateProductVariantDto } from '../dto/create-product-variant.dto';
import { UpdateProductVariantDto } from '../dto/update-product-variant.dto';
import { InventoryValidationService } from '../services/inventory-validation.service';
import { ProductVariantsService } from '../services/product-variants.service';

@ApiTags('product-variants')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('products')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ProductVariantsController {
  constructor(
    private readonly product_variants_service: ProductVariantsService,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  @Post(':id/variants')
  @RequirePermissions(PermissionKey.PRODUCTS_CREATE)
  @ApiOperation({ summary: 'Crear variante de producto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: CreateProductVariantDto })
  async create_variant(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
    @Body() dto: CreateProductVariantDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        product_id,
      );
    const variant = await this.product_variants_service.create_variant(
      business_id,
      product,
      dto,
    );
    return this.product_variants_service.serialize_variant(variant);
  }

  @Get(':id/variants')
  @RequirePermissions(PermissionKey.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Listar variantes de un producto' })
  @ApiParam({ name: 'id', type: Number })
  async list_variants(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.inventory_validation_service.get_product_in_business(
      business_id,
      product_id,
    );
    const variants = await this.product_variants_service.list_variants(
      business_id,
      product_id,
    );
    return variants.map((v) => this.product_variants_service.serialize_variant(v));
  }

  @Get(':id/variants/:variantId')
  @RequirePermissions(PermissionKey.PRODUCTS_VIEW)
  @ApiOperation({ summary: 'Obtener variante por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'variantId', type: Number })
  async get_variant(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) _product_id: number,
    @Param('variantId', ParseIntPipe) variant_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const variant = await this.product_variants_service.get_variant(
      business_id,
      variant_id,
    );
    return this.product_variants_service.serialize_variant(variant);
  }

  @Patch(':id/variants/:variantId')
  @RequirePermissions(PermissionKey.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Actualizar variante de producto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'variantId', type: Number })
  @ApiBody({ type: UpdateProductVariantDto })
  async update_variant(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) _product_id: number,
    @Param('variantId', ParseIntPipe) variant_id: number,
    @Body() dto: UpdateProductVariantDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const variant = await this.product_variants_service.update_variant(
      business_id,
      variant_id,
      dto,
    );
    return this.product_variants_service.serialize_variant(variant);
  }

  @Delete(':id/variants/:variantId')
  @RequirePermissions(PermissionKey.PRODUCTS_UPDATE)
  @ApiOperation({ summary: 'Desactivar variante de producto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiParam({ name: 'variantId', type: Number })
  async deactivate_variant(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) _product_id: number,
    @Param('variantId', ParseIntPipe) variant_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const variant = await this.product_variants_service.deactivate_variant(
      business_id,
      variant_id,
    );
    return this.product_variants_service.serialize_variant(variant);
  }
}
