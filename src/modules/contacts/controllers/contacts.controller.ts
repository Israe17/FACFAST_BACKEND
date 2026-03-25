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
  Query,
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
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactsService } from '../services/contacts.service';

@ApiTags('contacts')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('contacts')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ContactsController {
  constructor(private readonly contacts_service: ContactsService) {}

  @Get()
  @RequirePermissions(PermissionKey.CONTACTS_VIEW)
  @ApiOperation({
    summary: 'Listar contactos del negocio autenticado (paginado)',
  })
  @ApiOkResponse({ description: 'Lista paginada de clientes y proveedores.' })
  get_contacts(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.contacts_service.get_contacts_paginated(current_user, query);
  }

  @Post()
  @RequirePermissions(PermissionKey.CONTACTS_CREATE)
  @ApiOperation({ summary: 'Crear contacto' })
  @ApiBody({ type: CreateContactDto })
  @ApiOkResponse({ description: 'Contacto creado exitosamente.' })
  create_contact(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateContactDto,
  ) {
    return this.contacts_service.create_contact(current_user, dto);
  }

  @Get('lookup/:identification')
  @RequirePermissions(PermissionKey.CONTACTS_VIEW)
  @ApiOperation({
    summary: 'Buscar contacto por numero de identificacion dentro del negocio',
  })
  @ApiParam({
    name: 'identification',
    type: String,
    description: 'Numero de identificacion exacto.',
  })
  @ApiOkResponse({ description: 'Contacto encontrado por identificacion.' })
  lookup_by_identification(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('identification') identification: string,
  ) {
    return this.contacts_service.lookup_by_identification(
      current_user,
      identification,
    );
  }

  @Get(':contact_id')
  @RequirePermissions(PermissionKey.CONTACTS_VIEW)
  @ApiOperation({ summary: 'Obtener contacto por id' })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiOkResponse({ description: 'Detalle del contacto.' })
  get_contact(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
  ) {
    return this.contacts_service.get_contact(current_user, contact_id);
  }

  @Patch(':contact_id')
  @RequirePermissions(PermissionKey.CONTACTS_UPDATE)
  @ApiOperation({ summary: 'Actualizar contacto' })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiBody({ type: UpdateContactDto })
  @ApiOkResponse({ description: 'Contacto actualizado exitosamente.' })
  update_contact(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts_service.update_contact(current_user, contact_id, dto);
  }

  @Delete(':contact_id')
  @RequirePermissions(PermissionKey.CONTACTS_DELETE)
  @ApiOperation({ summary: 'Eliminar contacto' })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiOkResponse({ description: 'Contacto eliminado exitosamente.' })
  delete_contact(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
  ) {
    return this.contacts_service.delete_contact(current_user, contact_id);
  }
}
