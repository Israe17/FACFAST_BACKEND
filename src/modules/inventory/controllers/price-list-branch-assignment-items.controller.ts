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
import { UpdatePriceListBranchAssignmentDto } from '../dto/update-price-list-branch-assignment.dto';
import { PriceListBranchAssignmentsService } from '../services/price-list-branch-assignments.service';

@ApiTags('price-lists')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('price-list-branch-assignments')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class PriceListBranchAssignmentItemsController {
  constructor(
    private readonly price_list_branch_assignments_service: PriceListBranchAssignmentsService,
  ) {}

  @Get(':assignment_id')
  @RequirePermissions(PermissionKey.PRICE_LISTS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({ summary: 'Obtener assignment de lista de precios por id' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiOkResponse({ description: 'Detalle del assignment solicitado.' })
  get_price_list_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.price_list_branch_assignments_service.get_price_list_branch_assignment(
      current_user,
      assignment_id,
    );
  }

  @Patch(':assignment_id')
  @RequirePermissions(PermissionKey.PRICE_LISTS_UPDATE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Actualizar assignment de lista de precios' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiBody({ type: UpdatePriceListBranchAssignmentDto })
  @ApiOkResponse({ description: 'Assignment actualizado exitosamente.' })
  update_price_list_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
    @Body() dto: UpdatePriceListBranchAssignmentDto,
  ) {
    return this.price_list_branch_assignments_service.update_price_list_branch_assignment_by_id(
      current_user,
      assignment_id,
      dto,
    );
  }

  @Delete(':assignment_id')
  @RequirePermissions(PermissionKey.PRICE_LISTS_DELETE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Eliminar assignment de lista de precios' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiOkResponse({ description: 'Assignment eliminado exitosamente.' })
  delete_price_list_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.price_list_branch_assignments_service.delete_price_list_branch_assignment_by_id(
      current_user,
      assignment_id,
    );
  }
}
