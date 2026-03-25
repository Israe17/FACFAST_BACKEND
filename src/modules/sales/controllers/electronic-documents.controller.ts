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
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AllowPlatformPermissionOverride } from '../../common/decorators/allow-platform-permission-override.decorator';
import { AllowPlatformTenantContext } from '../../common/decorators/allow-platform-tenant-context.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { IdempotencyKey } from '../../common/decorators/idempotency-key.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantContextGuard } from '../../common/guards/tenant-context.guard';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
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
  @ApiOperation({
    summary: 'Listar documentos electronicos del negocio autenticado (paginado)',
  })
  @ApiOkResponse({ description: 'Lista paginada de documentos electronicos.' })
  get_documents(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: PaginatedQueryDto,
  ) {
    return this.electronic_documents_service.get_documents_paginated(
      current_user,
      query,
    );
  }

  @Get('cursor')
  @RequirePermissions(PermissionKey.ELECTRONIC_DOCUMENTS_VIEW)
  @ApiOperation({
    summary: 'Listar documentos electronicos del negocio autenticado (cursor)',
  })
  @ApiOkResponse({
    description: 'Lista cursor-first de documentos electronicos.',
  })
  get_documents_cursor(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Query() query: CursorQueryDto,
  ) {
    return this.electronic_documents_service.get_documents_cursor(
      current_user,
      query,
    );
  }

  @Get(':electronic_document_id')
  @RequirePermissions(PermissionKey.ELECTRONIC_DOCUMENTS_VIEW)
  @ApiOperation({ summary: 'Obtener documento electronico por id' })
  @ApiParam({ name: 'electronic_document_id', type: Number })
  get_document(
    @CurrentUser() current_user: AuthenticatedUserContext,
    @Param('electronic_document_id', ParseIntPipe) document_id: number,
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
    @IdempotencyKey() idempotency_key?: string | null,
  ) {
    return this.electronic_documents_service.emit_document(
      current_user,
      dto,
      idempotency_key,
    );
  }
}
