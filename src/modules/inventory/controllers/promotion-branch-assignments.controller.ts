import {
  ApiExcludeEndpoint,
  ApiBody,
  ApiCookieAuth,
  ApiForbiddenResponse,
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
import { CreatePromotionBranchAssignmentDto } from '../dto/create-promotion-branch-assignment.dto';
import { UpdatePromotionBranchAssignmentDto } from '../dto/update-promotion-branch-assignment.dto';
import { PromotionBranchAssignmentsService } from '../services/promotion-branch-assignments.service';

@ApiTags('promotions')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('promotions/:promotion_id/branches')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class PromotionBranchAssignmentsController {
  constructor(
    private readonly promotion_branch_assignments_service: PromotionBranchAssignmentsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.PROMOTIONS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({ summary: 'Listar assignments de sucursal de una promocion' })
  @ApiParam({ name: 'promotion_id', type: Number })
  get_promotion_branch_assignments(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('promotion_id', ParseIntPipe) promotion_id: number,
  ) {
    return this.promotion_branch_assignments_service.get_promotion_branch_assignments(
      current_user,
      promotion_id,
    );
  }

  @Post()
  @RequirePermissions(PermissionKey.PROMOTIONS_CREATE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Asignar promocion a sucursal' })
  @ApiParam({ name: 'promotion_id', type: Number })
  @ApiBody({ type: CreatePromotionBranchAssignmentDto })
  create_promotion_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('promotion_id', ParseIntPipe) promotion_id: number,
    @Body() dto: CreatePromotionBranchAssignmentDto,
  ) {
    return this.promotion_branch_assignments_service.create_promotion_branch_assignment(
      current_user,
      promotion_id,
      dto,
    );
  }

  @Patch(':assignment_id')
  @ApiExcludeEndpoint()
  @RequirePermissions(PermissionKey.PROMOTIONS_UPDATE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Actualizar assignment de promocion por sucursal' })
  @ApiParam({ name: 'promotion_id', type: Number })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiBody({ type: UpdatePromotionBranchAssignmentDto })
  update_promotion_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('promotion_id', ParseIntPipe) promotion_id: number,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
    @Body() dto: UpdatePromotionBranchAssignmentDto,
  ) {
    return this.promotion_branch_assignments_service.update_promotion_branch_assignment(
      current_user,
      promotion_id,
      assignment_id,
      dto,
    );
  }

  @Delete(':assignment_id')
  @ApiExcludeEndpoint()
  @RequirePermissions(PermissionKey.PROMOTIONS_DELETE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Eliminar assignment de promocion por sucursal' })
  @ApiParam({ name: 'promotion_id', type: Number })
  @ApiParam({ name: 'assignment_id', type: Number })
  delete_promotion_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('promotion_id', ParseIntPipe) promotion_id: number,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.promotion_branch_assignments_service.delete_promotion_branch_assignment(
      current_user,
      promotion_id,
      assignment_id,
    );
  }
}
