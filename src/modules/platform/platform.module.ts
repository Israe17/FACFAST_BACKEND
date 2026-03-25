import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BranchesModule } from '../branches/branches.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { PlatformBusinessesController } from './controllers/platform-businesses.controller';
import { PlatformContextController } from './controllers/platform-context.controller';
import { PlatformContextPolicy } from './policies/platform-context.policy';
import { PlatformBranchSerializer } from './serializers/platform-branch.serializer';
import { PlatformBusinessSerializer } from './serializers/platform-business.serializer';
import { PlatformContextSerializer } from './serializers/platform-context.serializer';
import { PlatformBusinessesService } from './services/platform-businesses.service';
import { PlatformContextService } from './services/platform-context.service';
import { PlatformValidationService } from './services/platform-validation.service';
import { ClearPlatformBusinessContextUseCase } from './use-cases/clear-platform-business-context.use-case';
import { EnterPlatformBusinessContextUseCase } from './use-cases/enter-platform-business-context.use-case';
import { GetPlatformBusinessBranchesQueryUseCase } from './use-cases/get-platform-business-branches.query.use-case';
import { GetPlatformBusinessQueryUseCase } from './use-cases/get-platform-business.query.use-case';
import { GetPlatformBusinessesListQueryUseCase } from './use-cases/get-platform-businesses-list.query.use-case';
import { OnboardPlatformBusinessUseCase } from './use-cases/onboard-platform-business.use-case';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, BusinessesModule, BranchesModule, UsersModule],
  controllers: [PlatformBusinessesController, PlatformContextController],
  providers: [
    PlatformBusinessSerializer,
    PlatformBranchSerializer,
    PlatformContextSerializer,
    PlatformContextPolicy,
    PlatformValidationService,
    GetPlatformBusinessesListQueryUseCase,
    GetPlatformBusinessQueryUseCase,
    GetPlatformBusinessBranchesQueryUseCase,
    OnboardPlatformBusinessUseCase,
    EnterPlatformBusinessContextUseCase,
    ClearPlatformBusinessContextUseCase,
    PlatformBusinessesService,
    PlatformContextService,
  ],
})
export class PlatformModule {}
