import {
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Get,
  NotFoundException,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TaxpayerService } from '../services/taxpayer.service';
import { ExonerationService } from '../services/exoneration.service';

@ApiTags('hacienda')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('hacienda')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class HaciendaController {
  constructor(
    private readonly taxpayer_service: TaxpayerService,
    private readonly exoneration_service: ExonerationService,
  ) {}

  @Get('taxpayer')
  @RequirePermissions(PermissionKey.CONTACTS_VIEW)
  @ApiOperation({ summary: 'Consultar contribuyente en Hacienda por identificacion' })
  @ApiQuery({
    name: 'identification',
    required: true,
    description: 'Numero de cedula o identificacion',
  })
  @ApiOkResponse({ description: 'Datos del contribuyente.' })
  @ApiNotFoundResponse({ description: 'Contribuyente no encontrado.' })
  async lookup_taxpayer(@Query('identification') identification: string) {
    const result = await this.taxpayer_service.lookup(identification);
    if (!result) {
      throw new NotFoundException('Taxpayer not found');
    }
    return { taxpayer: result };
  }

  @Get('exoneration')
  @RequirePermissions(PermissionKey.CONTACTS_VIEW)
  @ApiOperation({ summary: 'Verificar documento de exoneracion en Hacienda' })
  @ApiQuery({
    name: 'authorization',
    required: true,
    description: 'Numero de autorizacion (ej: AL-00460853-20)',
  })
  @ApiOkResponse({ description: 'Datos de exoneracion.' })
  @ApiNotFoundResponse({ description: 'Documento de exoneracion no encontrado.' })
  async verify_exoneration(@Query('authorization') authorization: string) {
    const result = await this.exoneration_service.verify(authorization);
    if (!result) {
      throw new NotFoundException('Exoneration document not found');
    }
    return { exoneration: result };
  }
}
