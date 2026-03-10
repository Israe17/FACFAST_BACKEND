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
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RbacService } from '../services/rbac.service';

@ApiTags('rbac')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class RolesController {
  constructor(private readonly rbac_service: RbacService) {}

  @Get()
  @RequirePermissions('roles.view')
  @ApiOperation({ summary: 'Listar roles' })
  @ApiOkResponse({ description: 'Lista de roles de la empresa autenticada.' })
  get_roles(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.rbac_service.get_roles(current_user);
  }

  @Post()
  @RequirePermissions('roles.create')
  @ApiOperation({ summary: 'Crear rol' })
  @ApiBody({ type: CreateRoleDto })
  @ApiOkResponse({ description: 'Rol creado exitosamente.' })
  create_role(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateRoleDto,
  ) {
    return this.rbac_service.create_role(current_user, dto);
  }

  @Patch(':id')
  @RequirePermissions('roles.update')
  @ApiOperation({ summary: 'Actualizar rol' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateRoleDto })
  @ApiOkResponse({ description: 'Rol actualizado exitosamente.' })
  update_role(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) role_id: number,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.rbac_service.update_role(current_user, role_id, dto);
  }

  @Delete(':id')
  @RequirePermissions('roles.delete')
  @ApiOperation({ summary: 'Eliminar rol' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Rol eliminado exitosamente.' })
  delete_role(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) role_id: number,
  ) {
    return this.rbac_service.delete_role(current_user, role_id);
  }

  @Put(':id/permissions')
  @RequirePermissions('roles.assign_permissions')
  @ApiOperation({ summary: 'Asignar permisos a un rol' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AssignRolePermissionsDto })
  @ApiOkResponse({ description: 'Permisos del rol actualizados.' })
  assign_permissions(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) role_id: number,
    @Body() dto: AssignRolePermissionsDto,
  ) {
    return this.rbac_service.assign_permissions(current_user, role_id, dto);
  }
}
