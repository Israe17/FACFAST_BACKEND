import {
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
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
import { CreateBranchDto } from '../dto/create-branch.dto';
import { CreateTerminalDto } from '../dto/create-terminal.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';
import { BranchesService } from '../services/branches.service';

@ApiTags('branches')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({
  description: 'Permisos insuficientes o la sucursal no es accesible.',
})
@Controller('branches')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class BranchesController {
  constructor(private readonly branches_service: BranchesService) {}

  @Get()
  @RequirePermissions(PermissionKey.BRANCHES_VIEW)
  @ApiOperation({ summary: 'Listar sucursales accesibles' })
  @ApiOkResponse({
    description: 'Lista de sucursales visibles para el usuario.',
  })
  get_branches(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.branches_service.get_branches(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.BRANCHES_CREATE)
  @ApiOperation({ summary: 'Crear sucursal' })
  @ApiBody({ type: CreateBranchDto })
  @ApiOkResponse({ description: 'Sucursal creada exitosamente.' })
  create_branch(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateBranchDto,
  ) {
    return this.branches_service.create_branch(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.BRANCHES_VIEW)
  @ApiOperation({ summary: 'Obtener sucursal por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Detalle de la sucursal.' })
  get_branch(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) branch_id: number,
  ) {
    return this.branches_service.get_branch(current_user, branch_id);
  }

  @Patch(':id')
  @RequirePermissions(PermissionKey.BRANCHES_UPDATE)
  @ApiOperation({ summary: 'Actualizar sucursal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateBranchDto })
  @ApiOkResponse({ description: 'Sucursal actualizada exitosamente.' })
  update_branch(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) branch_id: number,
    @Body() dto: UpdateBranchDto,
  ) {
    return this.branches_service.update_branch(current_user, branch_id, dto);
  }

  @Post(':id/terminals')
  @RequirePermissions(PermissionKey.BRANCHES_CREATE_TERMINAL)
  @ApiOperation({ summary: 'Crear terminal de sucursal' })
  @ApiParam({ name: 'id', type: Number, description: 'ID de la sucursal' })
  @ApiBody({ type: CreateTerminalDto })
  @ApiOkResponse({ description: 'Terminal creada exitosamente.' })
  create_terminal(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) branch_id: number,
    @Body() dto: CreateTerminalDto,
  ) {
    return this.branches_service.create_terminal(current_user, branch_id, dto);
  }
}
