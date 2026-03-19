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
import { CreateBrandDto } from '../dto/create-brand.dto';
import { UpdateBrandDto } from '../dto/update-brand.dto';
import { BrandsService } from '../services/brands.service';

@ApiTags('brands')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('brands')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class BrandsController {
  constructor(private readonly brands_service: BrandsService) {}

  @Get()
  @RequirePermissions(PermissionKey.BRANDS_VIEW)
  @ApiOperation({ summary: 'Listar marcas' })
  get_brands(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.brands_service.get_brands(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.BRANDS_CREATE)
  @ApiOperation({ summary: 'Crear marca' })
  @ApiBody({ type: CreateBrandDto })
  create_brand(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateBrandDto,
  ) {
    return this.brands_service.create_brand(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.BRANDS_VIEW)
  @ApiOperation({ summary: 'Obtener marca por id' })
  @ApiParam({ name: 'id', type: Number })
  get_brand(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) brand_id: number,
  ) {
    return this.brands_service.get_brand(current_user, brand_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.BRANDS_UPDATE)
  @ApiOperation({ summary: 'Actualizar marca' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateBrandDto })
  update_brand(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) brand_id: number,
    @Body() dto: UpdateBrandDto,
  ) {
    return this.brands_service.update_brand(current_user, brand_id, dto);
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.BRANDS_UPDATE)
  @ApiOperation({ summary: 'Eliminar marca (solo si no está en uso)' })
  @ApiParam({ name: 'id', type: Number })
  delete_brand(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) brand_id: number,
  ) {
    return this.brands_service.delete_brand(current_user, brand_id);
  }
}
