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
import { CreateMeasurementUnitDto } from '../dto/create-measurement-unit.dto';
import { UpdateMeasurementUnitDto } from '../dto/update-measurement-unit.dto';
import { MeasurementUnitsService } from '../services/measurement-units.service';

@ApiTags('measurement-units')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('measurement-units')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class MeasurementUnitsController {
  constructor(
    private readonly measurement_units_service: MeasurementUnitsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.MEASUREMENT_UNITS_VIEW)
  @ApiOperation({ summary: 'Listar unidades de medida' })
  get_measurement_units(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.measurement_units_service.get_measurement_units(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.MEASUREMENT_UNITS_CREATE)
  @ApiOperation({ summary: 'Crear unidad de medida' })
  @ApiBody({ type: CreateMeasurementUnitDto })
  create_measurement_unit(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateMeasurementUnitDto,
  ) {
    return this.measurement_units_service.create_measurement_unit(
      current_user,
      dto,
    );
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.MEASUREMENT_UNITS_VIEW)
  @ApiOperation({ summary: 'Obtener unidad por id' })
  @ApiParam({ name: 'id', type: Number })
  get_measurement_unit(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) measurement_unit_id: number,
  ) {
    return this.measurement_units_service.get_measurement_unit(
      current_user,
      measurement_unit_id,
    );
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.MEASUREMENT_UNITS_UPDATE)
  @ApiOperation({ summary: 'Actualizar unidad de medida' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateMeasurementUnitDto })
  update_measurement_unit(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) measurement_unit_id: number,
    @Body() dto: UpdateMeasurementUnitDto,
  ) {
    return this.measurement_units_service.update_measurement_unit(
      current_user,
      measurement_unit_id,
      dto,
    );
  }

  @Delete(':id')
  @RequirePermissions(PermissionKey.MEASUREMENT_UNITS_UPDATE)
  @ApiOperation({
    summary: 'Eliminar unidad de medida (solo si no está en uso)',
  })
  @ApiParam({ name: 'id', type: Number })
  delete_measurement_unit(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) measurement_unit_id: number,
  ) {
    return this.measurement_units_service.delete_measurement_unit(
      current_user,
      measurement_unit_id,
    );
  }
}
