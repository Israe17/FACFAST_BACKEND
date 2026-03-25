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
import { UpdateTerminalDto } from '../dto/update-terminal.dto';
import { TerminalsService } from '../services/terminals.service';

@ApiTags('branches')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({
  description: 'Permisos insuficientes o la sucursal no es accesible.',
})
@Controller('terminals')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class TerminalsController {
  constructor(private readonly terminals_service: TerminalsService) {}

  @Get(':terminal_id')
  @RequirePermissions(PermissionKey.BRANCHES_VIEW)
  @ApiOperation({ summary: 'Obtener terminal por id' })
  @ApiParam({ name: 'terminal_id', type: Number })
  @ApiOkResponse({ description: 'Detalle de la terminal.' })
  get_terminal(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('terminal_id', ParseIntPipe) terminal_id: number,
  ) {
    return this.terminals_service.get_terminal(current_user, terminal_id);
  }

  @Patch(':terminal_id')
  @RequirePermissions(PermissionKey.BRANCHES_UPDATE_TERMINAL)
  @ApiOperation({ summary: 'Actualizar terminal' })
  @ApiParam({ name: 'terminal_id', type: Number })
  @ApiBody({ type: UpdateTerminalDto })
  @ApiOkResponse({ description: 'Terminal actualizada exitosamente.' })
  update_terminal(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('terminal_id', ParseIntPipe) terminal_id: number,
    @Body() dto: UpdateTerminalDto,
  ) {
    return this.terminals_service.update_terminal(
      current_user,
      terminal_id,
      dto,
    );
  }

  @Delete(':terminal_id')
  @RequirePermissions(PermissionKey.BRANCHES_DELETE_TERMINAL)
  @ApiOperation({ summary: 'Eliminar terminal' })
  @ApiParam({ name: 'terminal_id', type: Number })
  @ApiOkResponse({ description: 'Terminal eliminada exitosamente.' })
  delete_terminal(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('terminal_id', ParseIntPipe) terminal_id: number,
  ) {
    return this.terminals_service.delete_terminal(current_user, terminal_id);
  }
}
