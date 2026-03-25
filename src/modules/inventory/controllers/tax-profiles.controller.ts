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
import { CreateTaxProfileDto } from '../dto/create-tax-profile.dto';
import { UpdateTaxProfileDto } from '../dto/update-tax-profile.dto';
import { TaxProfilesService } from '../services/tax-profiles.service';

@ApiTags('tax-profiles')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('tax-profiles')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class TaxProfilesController {
  constructor(private readonly tax_profiles_service: TaxProfilesService) {}

  @Get()
  @RequirePermissions(PermissionKey.TAX_PROFILES_VIEW)
  @ApiOperation({ summary: 'Listar perfiles fiscales' })
  get_tax_profiles(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.tax_profiles_service.get_tax_profiles(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.TAX_PROFILES_CREATE)
  @ApiOperation({ summary: 'Crear perfil fiscal' })
  @ApiBody({ type: CreateTaxProfileDto })
  create_tax_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateTaxProfileDto,
  ) {
    return this.tax_profiles_service.create_tax_profile(current_user, dto);
  }

  @Get(':tax_profile_id')
  @RequirePermissions(PermissionKey.TAX_PROFILES_VIEW)
  @ApiOperation({ summary: 'Obtener perfil fiscal por id' })
  @ApiParam({ name: 'tax_profile_id', type: Number })
  get_tax_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('tax_profile_id', ParseIntPipe) tax_profile_id: number,
  ) {
    return this.tax_profiles_service.get_tax_profile(
      current_user,
      tax_profile_id,
    );
  }

  @Patch(':tax_profile_id')
  @RequirePermissions(PermissionKey.TAX_PROFILES_UPDATE)
  @ApiOperation({ summary: 'Actualizar perfil fiscal' })
  @ApiParam({ name: 'tax_profile_id', type: Number })
  @ApiBody({ type: UpdateTaxProfileDto })
  update_tax_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('tax_profile_id', ParseIntPipe) tax_profile_id: number,
    @Body() dto: UpdateTaxProfileDto,
  ) {
    return this.tax_profiles_service.update_tax_profile(
      current_user,
      tax_profile_id,
      dto,
    );
  }
}
