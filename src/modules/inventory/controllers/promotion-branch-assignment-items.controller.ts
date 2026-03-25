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
import { UpdatePromotionBranchAssignmentDto } from '../dto/update-promotion-branch-assignment.dto';
import { PromotionBranchAssignmentsService } from '../services/promotion-branch-assignments.service';

@ApiTags('promotions')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('promotion-branch-assignments')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class PromotionBranchAssignmentItemsController {
  constructor(
    private readonly promotion_branch_assignments_service: PromotionBranchAssignmentsService,
  ) {}

  @Get(':assignment_id')
  @RequirePermissions(PermissionKey.PROMOTIONS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({ summary: 'Obtener assignment de promocion por id' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiOkResponse({ description: 'Detalle del assignment solicitado.' })
  get_promotion_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.promotion_branch_assignments_service.get_promotion_branch_assignment(
      current_user,
      assignment_id,
    );
  }

  @Patch(':assignment_id')
  @RequirePermissions(PermissionKey.PROMOTIONS_UPDATE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Actualizar assignment de promocion' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiBody({ type: UpdatePromotionBranchAssignmentDto })
  @ApiOkResponse({ description: 'Assignment actualizado exitosamente.' })
  update_promotion_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
    @Body() dto: UpdatePromotionBranchAssignmentDto,
  ) {
    return this.promotion_branch_assignments_service.update_promotion_branch_assignment_by_id(
      current_user,
      assignment_id,
      dto,
    );
  }

  @Delete(':assignment_id')
  @RequirePermissions(PermissionKey.PROMOTIONS_DELETE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Eliminar assignment de promocion' })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiOkResponse({ description: 'Assignment eliminado exitosamente.' })
  delete_promotion_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.promotion_branch_assignments_service.delete_promotion_branch_assignment_by_id(
      current_user,
      assignment_id,
    );
  }
}
