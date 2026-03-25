import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { InventoryValidationSubModule } from './inventory-validation.sub-module';
import { PriceListBranchAssignment } from './entities/price-list-branch-assignment.entity';
import { PromotionBranchAssignment } from './entities/promotion-branch-assignment.entity';
import { PriceListBranchAssignmentsRepository } from './repositories/price-list-branch-assignments.repository';
import { PromotionBranchAssignmentsRepository } from './repositories/promotion-branch-assignments.repository';
import { PricingValidationService } from './services/pricing-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceListBranchAssignment,
      PromotionBranchAssignment,
    ]),
    BranchesModule,
    InventoryValidationSubModule,
  ],
  providers: [
    PriceListBranchAssignmentsRepository,
    PromotionBranchAssignmentsRepository,
    PricingValidationService,
  ],
  exports: [PricingValidationService],
})
export class PricingValidationSubModule {}
