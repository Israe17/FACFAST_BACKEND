import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { BranchPromotionsController } from './controllers/branch-promotions.controller';
import { PromotionBranchAssignmentItemsController } from './controllers/promotion-branch-assignment-items.controller';
import { PromotionBranchAssignmentsController } from './controllers/promotion-branch-assignments.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { PromotionBranchAssignment } from './entities/promotion-branch-assignment.entity';
import { PromotionItem } from './entities/promotion-item.entity';
import { Promotion } from './entities/promotion.entity';
import { PromotionBranchAssignmentPolicy } from './policies/promotion-branch-assignment.policy';
import { PromotionDefinitionPolicy } from './policies/promotion-definition.policy';
import { PromotionBranchAssignmentsRepository } from './repositories/promotion-branch-assignments.repository';
import { PromotionsRepository } from './repositories/promotions.repository';
import { PromotionBranchAssignmentSerializer } from './serializers/promotion-branch-assignment.serializer';
import { PromotionSerializer } from './serializers/promotion.serializer';
import { PromotionBranchAssignmentsService } from './services/promotion-branch-assignments.service';
import { PromotionsService } from './services/promotions.service';
import { ProductsSubModule } from './products.sub-module';
import { CreatePromotionBranchAssignmentUseCase } from './use-cases/create-promotion-branch-assignment.use-case';
import { CreatePromotionUseCase } from './use-cases/create-promotion.use-case';
import { DeletePromotionBranchAssignmentUseCase } from './use-cases/delete-promotion-branch-assignment.use-case';
import { DeletePromotionUseCase } from './use-cases/delete-promotion.use-case';
import { GetBranchPromotionsQueryUseCase } from './use-cases/get-branch-promotions.query.use-case';
import { GetPromotionBranchAssignmentQueryUseCase } from './use-cases/get-promotion-branch-assignment.query.use-case';
import { GetPromotionBranchAssignmentsQueryUseCase } from './use-cases/get-promotion-branch-assignments.query.use-case';
import { GetPromotionQueryUseCase } from './use-cases/get-promotion.query.use-case';
import { GetPromotionsListQueryUseCase } from './use-cases/get-promotions-list.query.use-case';
import { UpdatePromotionBranchAssignmentUseCase } from './use-cases/update-promotion-branch-assignment.use-case';
import { UpdatePromotionUseCase } from './use-cases/update-promotion.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Promotion,
      PromotionItem,
      PromotionBranchAssignment,
    ]),
    BranchesModule,
    ProductsSubModule,
  ],
  controllers: [
    PromotionsController,
    PromotionBranchAssignmentsController,
    PromotionBranchAssignmentItemsController,
    BranchPromotionsController,
  ],
  providers: [
    PromotionsRepository,
    PromotionBranchAssignmentsRepository,
    PromotionBranchAssignmentPolicy,
    PromotionDefinitionPolicy,
    PromotionSerializer,
    PromotionBranchAssignmentSerializer,
    PromotionsService,
    PromotionBranchAssignmentsService,
    GetPromotionsListQueryUseCase,
    GetPromotionQueryUseCase,
    CreatePromotionUseCase,
    UpdatePromotionUseCase,
    DeletePromotionUseCase,
    GetPromotionBranchAssignmentsQueryUseCase,
    GetBranchPromotionsQueryUseCase,
    GetPromotionBranchAssignmentQueryUseCase,
    CreatePromotionBranchAssignmentUseCase,
    UpdatePromotionBranchAssignmentUseCase,
    DeletePromotionBranchAssignmentUseCase,
  ],
  exports: [
    PromotionsService,
    PromotionBranchAssignmentsService,
    PromotionsRepository,
    PromotionBranchAssignmentsRepository,
  ],
})
export class PromotionsSubModule {}
