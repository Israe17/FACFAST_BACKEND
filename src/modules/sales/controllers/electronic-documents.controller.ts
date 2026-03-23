import {
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
  Get,
  Param,
  ParseIntPipe,
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
import { CreateElectronicDocumentDto } from '../dto/create-electronic-document.dto';
import { ElectronicDocumentsService } from '../services/electronic-documents.service';

@ApiTags('electronic-documents')
@ApiCookieAuth('access-cookie')
@ApiUnauthorizedResponse({ description: 'Access token invalido o ausente.' })
@ApiForbiddenResponse({ description: 'Permisos insuficientes.' })
@Controller('electronic-documents')
@AllowPlatformPermissionOverride()
@AllowPlatformTenantContext()
@UseGuards(JwtAuthGuard, TenantContextGuard, PermissionsGuard)
export class ElectronicDocumentsController {
  constructor(
    private readonly electronic_documents_service: ElectronicDocumentsService,
  ) {}

  @Get()
  @RequirePermissions(PermissionKey.ELECTRONIC_DOCUMENTS_VIEW)
  @ApiOperation({ summary: 'Listar documentos electronicos' })
  get_documents(@CurrentUser() current_user: AuthenticatedUserContext) {
    return this.electronic_documents_service.get_documents(current_user);
  }

  @Get(':id')
  @RequirePermissions(PermissionKey.ELECTRONIC_DOCUMENTS_VIEW)
  @ApiOperation({ summary: 'Obtener documento electronico por id' })
  @ApiParam({ name: 'id', type: Number })
  get_document(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('id', ParseIntPipe) document_id: number,
  ) {
    return this.electronic_documents_service.get_document(
      current_user,
      document_id,
    );
  }

  @Post('emit')
  @RequirePermissions(PermissionKey.ELECTRONIC_DOCUMENTS_EMIT)
  @ApiOperation({ summary: 'Emitir documento electronico desde orden de venta' })
  @ApiBody({ type: CreateElectronicDocumentDto })
  emit_document(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Body() dto: CreateElectronicDocumentDto,
  ) {
    return this.electronic_documents_service.emit_document(current_user, dto);
  }
}
