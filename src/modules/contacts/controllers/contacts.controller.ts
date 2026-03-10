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
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactsService } from '../services/contacts.service';

@ApiTags('contacts')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('contacts')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ContactsController {
  constructor(private readonly contacts_service: ContactsService) {}

  @Get()
  @RequirePermissions('contacts.view')
  @ApiOperation({ summary: 'Listar contactos del negocio autenticado' })
  @ApiOkResponse({ description: 'Lista de clientes y proveedores.' })
  get_contacts(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.contacts_service.get_contacts(current_user);
  }

  @Post()
  @RequirePermissions('contacts.create')
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
  @RequirePermissions('contacts.view')
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

  @Get(':id')
  @RequirePermissions('contacts.view')
  @ApiOperation({ summary: 'Obtener contacto por id' })
  @ApiParam({ name: 'id', type: Number })
  @ApiOkResponse({ description: 'Detalle del contacto.' })
  get_contact(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) contact_id: number,
  ) {
    return this.contacts_service.get_contact(current_user, contact_id);
  }

  @Patch(':id')
  @RequirePermissions('contacts.update')
  @ApiOperation({ summary: 'Actualizar contacto' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateContactDto })
  @ApiOkResponse({ description: 'Contacto actualizado exitosamente.' })
  update_contact(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) contact_id: number,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contacts_service.update_contact(current_user, contact_id, dto);
  }
}
