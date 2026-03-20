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
import { CreateContactBranchAssignmentDto } from '../dto/create-contact-branch-assignment.dto';
import { UpdateContactBranchAssignmentDto } from '../dto/update-contact-branch-assignment.dto';
import { ContactBranchAssignmentsService } from '../services/contact-branch-assignments.service';

@ApiTags('contacts')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('contacts/:contact_id/branches')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ContactBranchAssignmentsController {
  constructor(
    private readonly contact_branch_assignments_service: ContactBranchAssignmentsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.CONTACTS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({
    summary: 'Listar contexto comercial por sucursal de un contacto',
  })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiOkResponse({
    description:
      'Devuelve si el contacto es global o limitado por sucursal y sus assignments visibles.',
  })
  get_contact_branch_assignments(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
  ) {
    return this.contact_branch_assignments_service.get_contact_branch_assignments(
      current_user,
      contact_id,
    );
  }

  @Post()
  @RequirePermissions(PermissionKey.CONTACTS_CREATE_BRANCH_ASSIGNMENT)
  @ApiOperation({
    summary: 'Crear assignment comercial de contacto por sucursal',
  })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiBody({ type: CreateContactBranchAssignmentDto })
  create_contact_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
    @Body() dto: CreateContactBranchAssignmentDto,
  ) {
    return this.contact_branch_assignments_service.create_contact_branch_assignment(
      current_user,
      contact_id,
      dto,
    );
  }

  @Patch(':assignment_id')
  @RequirePermissions(PermissionKey.CONTACTS_UPDATE_BRANCH_ASSIGNMENT)
  @ApiOperation({
    summary: 'Actualizar assignment comercial de contacto por sucursal',
  })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiBody({ type: UpdateContactBranchAssignmentDto })
  update_contact_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
    @Body() dto: UpdateContactBranchAssignmentDto,
  ) {
    return this.contact_branch_assignments_service.update_contact_branch_assignment(
      current_user,
      contact_id,
      assignment_id,
      dto,
    );
  }

  @Delete(':assignment_id')
  @RequirePermissions(PermissionKey.CONTACTS_DELETE_BRANCH_ASSIGNMENT)
  @ApiOperation({
    summary: 'Eliminar assignment comercial de contacto por sucursal',
  })
  @ApiParam({ name: 'contact_id', type: Number })
  @ApiParam({ name: 'assignment_id', type: Number })
  delete_contact_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('contact_id', ParseIntPipe) contact_id: number,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.contact_branch_assignments_service.delete_contact_branch_assignment(
      current_user,
      contact_id,
      assignment_id,
    );
  }
}
