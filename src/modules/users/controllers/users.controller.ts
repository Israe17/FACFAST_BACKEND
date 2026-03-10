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
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
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
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UsersController {
  constructor(private readonly users_service: UsersService) {}

  @Get()
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Listar usuarios' })
  @ApiOkResponse({
    description: 'Lista de usuarios de la empresa autenticada.',
  })
  get_users(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.users_service.get_users(current_user);
  }

  @Post()
  @RequirePermissions('users.create')
  @ApiOperation({ summary: 'Crear usuario' })
  @ApiBody({ type: CreateUserDto })
  @ApiOkResponse({ description: 'Usuario creado exitosamente.' })
  create_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateUserDto,
  ) {
    return this.users_service.create_user(current_user, dto);
  }

  @Get(':id')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Obtener usuario por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Detalle del usuario.' })
  get_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
  ) {
    return this.users_service.get_user(current_user, user_id);
  }

  @Patch(':id')
  @RequirePermissions('users.update')
  @ApiOperation({ summary: 'Actualizar usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Usuario actualizado exitosamente.' })
  update_user(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.users_service.update_user(current_user, user_id, dto);
  }

  @Patch(':id/status')
  @RequirePermissions('users.change_status')
  @ApiOperation({ summary: 'Cambiar estado de usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserStatusDto })
  @ApiOkResponse({ description: 'Estado del usuario actualizado.' })
  update_user_status(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.users_service.update_user_status(current_user, user_id, dto);
  }

  @Patch(':id/password')
  @RequirePermissions('users.change_password')
  @ApiOperation({ summary: 'Cambiar password de usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateUserPasswordDto })
  @ApiOkResponse({ description: 'Password actualizada exitosamente.' })
  update_user_password(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
    @Body() dto: UpdateUserPasswordDto,
  ) {
    return this.users_service.update_user_password(current_user, user_id, dto);
  }

  @Put(':id/roles')
  @RequirePermissions('users.assign_roles')
  @ApiOperation({ summary: 'Asignar roles a un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AssignUserRolesDto })
  @ApiOkResponse({ description: 'Roles del usuario actualizados.' })
  assign_roles(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
    @Body() dto: AssignUserRolesDto,
  ) {
    return this.users_service.assign_roles(current_user, user_id, dto);
  }

  @Put(':id/branches')
  @RequirePermissions('users.assign_branches')
  @ApiOperation({ summary: 'Asignar sucursales a un usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: AssignUserBranchesDto })
  @ApiOkResponse({ description: 'Sucursales del usuario actualizadas.' })
  assign_branches(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
    @Body() dto: AssignUserBranchesDto,
  ) {
    return this.users_service.assign_branches(current_user, user_id, dto);
  }

  @Get(':id/effective-permissions')
  @RequirePermissions('users.view')
  @ApiOperation({ summary: 'Obtener permisos efectivos del usuario' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({
    description:
      'Contexto efectivo del usuario con roles, permisos y branch_ids.',
  })
  get_effective_permissions(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) user_id: number,
  ) {
    return this.users_service.get_effective_permissions(current_user, user_id);
  }
}
