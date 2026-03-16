import { Global, Module } from '@nestjs/common';
import { HttpExceptionFilter } from './filters/http-exception.filter';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { PlatformAdminGuard } from './guards/platform-admin.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { TenantContextGuard } from './guards/tenant-context.guard';
import { ErrorI18nService } from './i18n/error-i18n.service';
import { StructuredLoggerService } from './logging/structured-logger.service';
import { BusinessSequenceService } from './services/business-sequence.service';
import { EntityCodeService } from './services/entity-code.service';
import { EncryptionService } from './services/encryption.service';
import { PasswordHashService } from './services/password-hash.service';

@Global()
@Module({
  providers: [
    EntityCodeService,
    EncryptionService,
    PasswordHashService,
    BusinessSequenceService,
    JwtAuthGuard,
    RefreshTokenGuard,
    PlatformAdminGuard,
    TenantContextGuard,
    PermissionsGuard,
    ErrorI18nService,
    StructuredLoggerService,
    HttpExceptionFilter,
  ],
  exports: [
    EntityCodeService,
    EncryptionService,
    PasswordHashService,
    BusinessSequenceService,
    JwtAuthGuard,
    RefreshTokenGuard,
    PlatformAdminGuard,
    TenantContextGuard,
    PermissionsGuard,
    ErrorI18nService,
    StructuredLoggerService,
    HttpExceptionFilter,
  ],
})
export class CommonModule {}
