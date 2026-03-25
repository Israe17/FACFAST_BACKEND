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
import { UpdateContactBranchAssignmentDto } from '../dto/update-contact-branch-assignment.dto';
import { ContactBranchAssignmentsService } from '../services/contact-branch-assignments.service';

@ApiTags('contacts')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('contact-branch-assignments')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ContactBranchAssignmentItemsController {
  constructor(
    private readonly contact_branch_assignments_service: ContactBranchAssignmentsService,
  ) {}

  @Get(':assignment_id')
  @RequirePermissions(PermissionKey.CONTACTS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({ summary: 'Obtener assignment comercial de contacto por id' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiOkResponse({ description: 'Detalle del assignment solicitado.' })
  get_contact_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.contact_branch_assignments_service.get_contact_branch_assignment(
      current_user,
      assignment_id,
    );
  }

  @Patch(':assignment_id')
  @RequirePermissions(PermissionKey.CONTACTS_UPDATE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Actualizar assignment comercial de contacto' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiBody({ type: UpdateContactBranchAssignmentDto })
  @ApiOkResponse({ description: 'Assignment actualizado exitosamente.' })
  update_contact_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
    @Body() dto: UpdateContactBranchAssignmentDto,
  ) {
    return this.contact_branch_assignments_service.update_contact_branch_assignment_by_id(
      current_user,
      assignment_id,
      dto,
    );
  }

  @Delete(':assignment_id')
  @RequirePermissions(PermissionKey.CONTACTS_DELETE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Eliminar assignment comercial de contacto' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiOkResponse({ description: 'Assignment eliminado exitosamente.' })
  delete_contact_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.contact_branch_assignments_service.delete_contact_branch_assignment_by_id(
      current_user,
      assignment_id,
    );
  }
}
