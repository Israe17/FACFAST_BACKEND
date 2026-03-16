import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { BranchesModule } from '../branches/branches.module';
import { BusinessesModule } from '../businesses/businesses.module';
import { PlatformBusinessesController } from './controllers/platform-businesses.controller';
import { PlatformContextController } from './controllers/platform-context.controller';
import { PlatformBusinessesService } from './services/platform-businesses.service';
import { PlatformContextService } from './services/platform-context.service';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [AuthModule, BusinessesModule, BranchesModule, UsersModule],
  controllers: [PlatformBusinessesController, PlatformContextController],
  providers: [PlatformBusinessesService, PlatformContextService],
})
export class PlatformModule {}
