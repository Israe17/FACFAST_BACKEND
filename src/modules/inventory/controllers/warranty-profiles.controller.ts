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
import { CreateWarrantyProfileDto } from '../dto/create-warranty-profile.dto';
import { UpdateWarrantyProfileDto } from '../dto/update-warranty-profile.dto';
import { WarrantyProfilesService } from '../services/warranty-profiles.service';

@ApiTags('warranty-profiles')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('warranty-profiles')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class WarrantyProfilesController {
  constructor(
    private readonly warranty_profiles_service: WarrantyProfilesService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.WARRANTY_PROFILES_VIEW)
  @ApiOperation({ summary: 'Listar perfiles de garantia' })
  get_warranty_profiles(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.warranty_profiles_service.get_warranty_profiles(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.WARRANTY_PROFILES_CREATE)
  @ApiOperation({ summary: 'Crear perfil de garantia' })
  @ApiBody({ type: CreateWarrantyProfileDto })
  create_warranty_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateWarrantyProfileDto,
  ) {
    return this.warranty_profiles_service.create_warranty_profile(
      current_user,
      dto,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.WARRANTY_PROFILES_VIEW)
  @ApiOperation({ summary: 'Obtener perfil de garantia por id' })
  @ApiParam({ name: 'id', type: Number })
  get_warranty_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warranty_profile_id: number,
  ) {
    return this.warranty_profiles_service.get_warranty_profile(
      current_user,
      warranty_profile_id,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.WARRANTY_PROFILES_UPDATE)
  @ApiOperation({ summary: 'Actualizar perfil de garantia' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateWarrantyProfileDto })
  update_warranty_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warranty_profile_id: number,
    @Body() dto: UpdateWarrantyProfileDto,
  ) {
    return this.warranty_profiles_service.update_warranty_profile(
      current_user,
      warranty_profile_id,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.WARRANTY_PROFILES_DELETE)
  @ApiOperation({
    summary: 'Eliminar perfil de garantia (solo si no está en uso)',
  })
  @ApiParam({ name: 'id', type: Number })
  delete_warranty_profile(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) warranty_profile_id: number,
  ) {
    return this.warranty_profiles_service.delete_warranty_profile(
      current_user,
      warranty_profile_id,
    );
  }
}
