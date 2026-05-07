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
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import { TaxpayerService } from '../services/taxpayer.service';
import { ExonerationService } from '../services/exoneration.service';
import { ContactEmailService } from '../services/contact-email.service';

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
    private readonly contact_email_service: ContactEmailService,
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
      throw new DomainNotFoundException({
        code: 'HACIENDA_TAXPAYER_NOT_FOUND',
        messageKey: 'hacienda.taxpayer_not_found',
        details: { identification },
      });
    }
    return { taxpayer: result };
  }

  @Get('email')
  @RequirePermissions(PermissionKey.CONTACTS_VIEW)
  @ApiOperation({
    summary:
      'Consultar correo del contribuyente registrado en Yo Contribuyo (Hacienda)',
  })
  @ApiQuery({
    name: 'identification',
    required: true,
    description: 'Numero de identificacion sin guiones',
  })
  @ApiOkResponse({ description: 'Correo electronico del contribuyente.' })
  @ApiNotFoundResponse({
    description:
      'El contribuyente no tiene correo registrado en Yo Contribuyo.',
  })
  async lookup_contact_email(@Query('identification') identification: string) {
    const email = await this.contact_email_service.lookup(identification);
    if (!email) {
      throw new DomainNotFoundException({
        code: 'HACIENDA_CONTACT_EMAIL_NOT_FOUND',
        messageKey: 'hacienda.contact_email_not_found',
        details: { identification },
      });
    }
    return { email };
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
      throw new DomainNotFoundException({
        code: 'HACIENDA_EXONERATION_NOT_FOUND',
        messageKey: 'hacienda.exoneration_not_found',
        details: { authorization },
      });
    }
    return { exoneration: result };
  }
}
