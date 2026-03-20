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
  Post,
  Put,
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
import { InventoryValidationService } from '../services/inventory-validation.service';
import { VariantAttributesService } from '../services/variant-attributes.service';
import { ProductVariantsService } from '../services/product-variants.service';

@ApiTags('variant-attributes')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('products')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class VariantAttributesController {
  constructor(
    private readonly variant_attributes_service: VariantAttributesService,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly product_variants_service: ProductVariantsService,
  ) {}

  @Put(':id/attributes')
  @RequirePermissions(PermissionKey.VARIANT_ATTRIBUTES_CONFIGURE)
  @ApiOperation({ summary: 'Definir atributos de variantes' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        attributes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              display_order: { type: 'number' },
              values: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    value: { type: 'string' },
                    display_order: { type: 'number' },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  async set_attributes(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
    @Body()
    body: {
      attributes: {
        name: string;
        display_order?: number;
        values: { value: string; display_order?: number }[];
      }[];
    },
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        product_id,
      );
    return this.variant_attributes_service.set_attributes(
      business_id,
      product,
      body.attributes,
    );
  }

  @Post(':id/attributes/generate-variants')
  @RequirePermissions(PermissionKey.VARIANT_ATTRIBUTES_GENERATE)
  @ApiOperation({ summary: 'Generar variantes a partir de atributos' })
  @ApiParam({ name: 'id', type: Number })
  async generate_variants(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        product_id,
      );
    const variants = await this.variant_attributes_service.generate_variants(
      business_id,
      product,
    );
    return Promise.all(
      variants.map((v) => this.product_variants_service.serialize_variant(v)),
    );
  }

  @Get(':id/attributes')
  @RequirePermissions(PermissionKey.VARIANT_ATTRIBUTES_VIEW)
  @ApiOperation({ summary: 'Listar atributos de variantes' })
  @ApiParam({ name: 'id', type: Number })
  async get_attributes(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) product_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    await this.inventory_validation_service.get_product_in_business(
      business_id,
      product_id,
    );
    return this.variant_attributes_service.get_attributes(
      business_id,
      product_id,
    );
  }
}
