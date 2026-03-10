import { Global, Module } from '@nestjs/common';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { PermissionsGuard } from './guards/permissions.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { EntityCodeService } from './services/entity-code.service';
import { EncryptionService } from './services/encryption.service';
import { PasswordHashService } from './services/password-hash.service';

@Global()
@Module({
  providers: [
    EntityCodeService,
    EncryptionService,
    PasswordHashService,
    JwtAuthGuard,
    RefreshTokenGuard,
    PermissionsGuard,
  ],
  exports: [
    EntityCodeService,
    EncryptionService,
    PasswordHashService,
    JwtAuthGuard,
    RefreshTokenGuard,
    PermissionsGuard,
  ],
})
export class CommonModule {}
