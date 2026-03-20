import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
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
import { PromotionBranchAssignmentsService } from '../services/promotion-branch-assignments.service';

@ApiTags('branches')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('branches/:branch_id/promotions')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class BranchPromotionsController {
  constructor(
    private readonly promotion_branch_assignments_service: PromotionBranchAssignmentsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.PROMOTIONS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({ summary: 'Listar promociones asignadas a una sucursal' })
  @ApiParam({ name: 'branch_id', type: Number })
  get_branch_promotions(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('branch_id', ParseIntPipe) branch_id: number,
  ) {
    return this.promotion_branch_assignments_service.get_branch_promotions(
      current_user,
      branch_id,
    );
  }
}
