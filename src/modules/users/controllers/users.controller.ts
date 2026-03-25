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
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { AssignUserBranchesDto } from '../dto/assign-user-branches.dto';
import { AssignUserRolesDto } from '../dto/assign-user-roles.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserPasswordDto } from '../dto/update-user-password.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UsersService } from '../services/users.service';

@ApiTags('users')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('users')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users_service: UsersService) {}

  @Get()
  @RequirePermissions(PermissionKey.USERS_VIEW)
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiOkResponse({
    description: 'Lista de usuarios de la empresa autenticada.',
  })
  get_users(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.users_service.get_users(current_user);
  }

  @Post()
  @RequirePermissions(PermissionKey.USERS_CREATE)
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ description: 'Usuario creado exitosamente.' })
  create_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateUserDto,
  ) {
    return this.users_service.create_user(current_user, dto);
  }

  @Get(':user_id')
  @RequirePermissions(PermissionKey.USERS_VIEW)
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiOkResponse({ description: 'Detalle del usuario.' })
  get_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
  ) {
    return this.users_service.get_user(current_user, user_id);
  }

  @Patch(':user_id')
  @RequirePermissions(PermissionKey.USERS_UPDATE)
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Usuario actualizado exitosamente.' })
  update_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users_service.update_user(current_user, user_id, dto);
  }

  @Patch(':user_id/status')
  @RequirePermissions(PermissionKey.USERS_CHANGE_STATUS)
  @ApiOperation({ summary: 'Cambiar estado de usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiOkResponse({ description: 'Estado del usuario actualizado.' })
  update_user_status(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.users_service.update_user_status(current_user, user_id, dto);
  }

  @Patch(':user_id/password')
  @RequirePermissions(PermissionKey.USERS_CHANGE_PASSWORD)
  @ApiOperation({ summary: 'Cambiar password de usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiBody({ type: UpdateUserPasswordDto })
  @ApiOkResponse({ description: 'Password actualizada exitosamente.' })
  update_user_password(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.users_service.update_user_password(current_user, user_id, dto);
  }

  @Put(':user_id/roles')
  @RequirePermissions(PermissionKey.USERS_ASSIGN_ROLES)
  @ApiOperation({ summary: 'Asignar roles a un usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiBody({ type: AssignUserRolesDto })
  @ApiOkResponse({ description: 'Roles del usuario actualizados.' })
  assign_roles(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: AssignUserRolesDto,
  ) {
    return this.users_service.assign_roles(current_user, user_id, dto);
  }

  @Put(':user_id/branches')
  @RequirePermissions(PermissionKey.USERS_ASSIGN_BRANCHES)
  @ApiOperation({ summary: 'Asignar sucursales a un usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiBody({ type: AssignUserBranchesDto })
  @ApiOkResponse({ description: 'Sucursales del usuario actualizadas.' })
  assign_branches(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
    @Body() dto: AssignUserBranchesDto,
  ) {
    return this.users_service.assign_branches(current_user, user_id, dto);
  }

  @Get(':user_id/effective-permissions')
  @RequirePermissions(PermissionKey.USERS_VIEW)
  @ApiOperation({ summary: 'Obtener permisos efectivos del usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiOkResponse({
    description:
      'Contexto efectivo del usuario con roles, permisos y branch_ids.',
  })
  get_effective_permissions(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
  ) {
    return this.users_service.get_effective_permissions(current_user, user_id);
  }

  @Delete(':user_id')
  @RequirePermissions(PermissionKey.USERS_DELETE)
  @ApiOperation({ summary: 'Eliminar usuario' })
  @ApiParam({ name: 'user_id', type: Number })
  @ApiOkResponse({ description: 'Usuario eliminado exitosamente.' })
  delete_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('user_id', ParseIntPipe) user_id: number,
  ) {
    return this.users_service.delete_user(current_user, user_id);
  }
}
