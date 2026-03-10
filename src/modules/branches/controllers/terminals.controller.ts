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
  Param,
  ParseIntPipe,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { UpdateTerminalDto } from '../dto/update-terminal.dto';
import { BranchesService } from '../services/branches.service';

@ApiTags('branches')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({
  description: 'Permisos insuficientes o la sucursal no es accesible.',
})
@Controller('terminals')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class TerminalsController {
  constructor(private readonly branches_service: BranchesService) {}

  @Patch(':id')
  @RequirePermissions('branches.update_terminal')
  @ApiOperation({ summary: 'Actualizar terminal' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateTerminalDto })
  @ApiOkResponse({ description: 'Terminal actualizada exitosamente.' })
  update_terminal(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) terminal_id: number,
    @Body() dto: UpdateTerminalDto,
  ) {
    return this.branches_service.update_terminal(
      current_user,
      terminal_id,
      dto,
    );
  }
}
