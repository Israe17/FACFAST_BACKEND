import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Business } from '../common/entities/business.entity';
import { RbacModule } from '../rbac/rbac.module';
import { BusinessesController } from './controllers/businesses.controller';
import { BusinessesRepository } from './repositories/businesses.repository';
import { BusinessOnboardingService } from './services/business-onboarding.service';
import { BusinessesService } from './services/businesses.service';

@Module({
  imports: [TypeOrmModule.forFeature([Business]), RbacModule],
  controllers: [BusinessesController],
  providers: [
    BusinessesRepository,
    BusinessOnboardingService,
    BusinessesService,
  ],
  exports: [BusinessOnboardingService, BusinessesRepository, BusinessesService],
})
export class BusinessesModule {}
