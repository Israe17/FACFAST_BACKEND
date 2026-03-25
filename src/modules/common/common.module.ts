import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OutboxEvent } from './entities/outbox-event.entity';
import { IdempotencyKey } from './entities/idempotency-key.entity';
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
import { IdempotencyKeysRepository } from './repositories/idempotency-keys.repository';
import { OutboxEventsRepository } from './repositories/outbox-events.repository';
import { IdempotencyService } from './services/idempotency.service';
import { PasswordHashService } from './services/password-hash.service';
import { OutboxService } from './services/outbox.service';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([OutboxEvent, IdempotencyKey])],
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
    IdempotencyKeysRepository,
    OutboxEventsRepository,
    IdempotencyService,
    OutboxService,
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
    IdempotencyKeysRepository,
    OutboxEventsRepository,
    IdempotencyService,
    OutboxService,
  ],
})
export class CommonModule {}
