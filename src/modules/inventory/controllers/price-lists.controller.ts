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
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { PricingService } from '../services/pricing.service';

@ApiTags('price-lists')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('price-lists')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class PriceListsController {
  constructor(private readonly pricing_service: PricingService) {}

  @Get()
  @RequirePermissions(PermissionKey.PRICE_LISTS_VIEW)
  @ApiOperation({ summary: 'Listar listas de precios' })
  get_price_lists(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.pricing_service.get_price_lists(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.PRICE_LISTS_CREATE)
  @ApiOperation({ summary: 'Crear lista de precios' })
  @ApiBody({ type: CreatePriceListDto })
  create_price_list(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreatePriceListDto,
  ) {
    return this.pricing_service.create_price_list(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.PRICE_LISTS_VIEW)
  @ApiOperation({ summary: 'Obtener lista de precios por id' })
  @ApiParam({ name: 'id', type: Number })
  get_price_list(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) price_list_id: number,
  ) {
    return this.pricing_service.get_price_list(current_user, price_list_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.PRICE_LISTS_UPDATE)
  @ApiOperation({ summary: 'Actualizar lista de precios' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdatePriceListDto })
  update_price_list(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) price_list_id: number,
    @Body() dto: UpdatePriceListDto,
  ) {
    return this.pricing_service.update_price_list(
      current_user,
      price_list_id,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.PRICE_LISTS_UPDATE)
  @ApiOperation({
    summary:
      'Eliminar lista de precios y todos sus precios (no aplica a la lista por defecto)',
  })
  @ApiParam({ name: 'id', type: Number })
  delete_price_list(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) price_list_id: number,
  ) {
    return this.pricing_service.delete_price_list(current_user, price_list_id);
  }
}
