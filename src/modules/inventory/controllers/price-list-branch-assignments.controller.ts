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
import { CreatePriceListBranchAssignmentDto } from '../dto/create-price-list-branch-assignment.dto';
import { UpdatePriceListBranchAssignmentDto } from '../dto/update-price-list-branch-assignment.dto';
import { PriceListBranchAssignmentsService } from '../services/price-list-branch-assignments.service';

@ApiTags('price-lists')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('price-lists/:price_list_id/branches')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class PriceListBranchAssignmentsController {
  constructor(
    private readonly price_list_branch_assignments_service: PriceListBranchAssignmentsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.PRICE_LISTS_VIEW_BRANCH_ASSIGNMENTS)
  @ApiOperation({
    summary: 'Listar assignments de sucursal de una lista de precios',
  })
  @ApiParam({ name: 'price_list_id', type: Number })
  get_price_list_branch_assignments(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('price_list_id', ParseIntPipe) price_list_id: number,
  ) {
    return this.price_list_branch_assignments_service.get_price_list_branch_assignments(
      current_user,
      price_list_id,
    );
  }

  @Post()
  @RequirePermissions(PermissionKey.PRICE_LISTS_CREATE_BRANCH_ASSIGNMENT)
  @ApiOperation({ summary: 'Asignar lista de precios a sucursal' })
  @ApiParam({ name: 'price_list_id', type: Number })
  @ApiBody({ type: CreatePriceListBranchAssignmentDto })
  create_price_list_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('price_list_id', ParseIntPipe) price_list_id: number,
    @Body() dto: CreatePriceListBranchAssignmentDto,
  ) {
    return this.price_list_branch_assignments_service.create_price_list_branch_assignment(
      current_user,
      price_list_id,
      dto,
    );
  }

  @Patch(':assignment_id')
  @ApiExcludeEndpoint()
  @RequirePermissions(PermissionKey.PRICE_LISTS_UPDATE_BRANCH_ASSIGNMENT)
  @ApiOperation({
    summary: 'Actualizar assignment de lista de precios por sucursal',
  })
  @ApiParam({ name: 'price_list_id', type: Number })
  @ApiParam({ name: 'assignment_id', type: Number })
  @ApiBody({ type: UpdatePriceListBranchAssignmentDto })
  update_price_list_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('price_list_id', ParseIntPipe) price_list_id: number,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
    @Body() dto: UpdatePriceListBranchAssignmentDto,
  ) {
    return this.price_list_branch_assignments_service.update_price_list_branch_assignment(
      current_user,
      price_list_id,
      assignment_id,
      dto,
    );
  }

  @Delete(':assignment_id')
  @ApiExcludeEndpoint()
  @RequirePermissions(PermissionKey.PRICE_LISTS_DELETE_BRANCH_ASSIGNMENT)
  @ApiOperation({
    summary: 'Eliminar assignment de lista de precios por sucursal',
  })
  @ApiParam({ name: 'price_list_id', type: Number })
  @ApiParam({ name: 'assignment_id', type: Number })
  delete_price_list_branch_assignment(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('price_list_id', ParseIntPipe) price_list_id: number,
    @Param('assignment_id', ParseIntPipe) assignment_id: number,
  ) {
    return this.price_list_branch_assignments_service.delete_price_list_branch_assignment(
      current_user,
      price_list_id,
      assignment_id,
    );
  }
}
