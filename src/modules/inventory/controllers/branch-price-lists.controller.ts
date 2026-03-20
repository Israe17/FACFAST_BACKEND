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
import { PriceListBranchAssignmentsService } from '../services/price-list-branch-assignments.service';

@ApiTags('branches')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('branches/:branch_id/price-lists')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class BranchPriceListsController {
  constructor(
    private readonly price_list_branch_assignments_service: PriceListBranchAssignmentsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.PRICE_LISTS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({
    summary: 'Listar listas de precios asignadas a una sucursal',
  })
  @ApiParam({ name: 'branch_id', type: Number })
  get_branch_price_lists(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('branch_id', ParseIntPipe) branch_id: number,
  ) {
    return this.price_list_branch_assignments_service.get_branch_price_lists(
      current_user,
      branch_id,
    );
  }
}
