import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { BranchPriceListsController } from './controllers/branch-price-lists.controller';
import { PriceListBranchAssignmentItemsController } from './controllers/price-list-branch-assignment-items.controller';
import { PriceListBranchAssignmentsController } from './controllers/price-list-branch-assignments.controller';
import { PriceListsController } from './controllers/price-lists.controller';
import { ProductPricesController } from './controllers/product-prices.controller';
import { PriceListBranchAssignment } from './entities/price-list-branch-assignment.entity';
import { PriceList } from './entities/price-list.entity';
import { ProductPrice } from './entities/product-price.entity';
import { InventoryValidationSubModule } from './inventory-validation.sub-module';
import { PriceListBranchAssignmentPolicy } from './policies/price-list-branch-assignment.policy';
import { PriceListLifecyclePolicy } from './policies/price-list-lifecycle.policy';
import { ProductPricePolicy } from './policies/product-price.policy';
import { PriceListBranchAssignmentsRepository } from './repositories/price-list-branch-assignments.repository';
import { PriceListsRepository } from './repositories/price-lists.repository';
import { ProductPricesRepository } from './repositories/product-prices.repository';
import { PricingValidationSubModule } from './pricing-validation.sub-module';
import { PriceListBranchAssignmentSerializer } from './serializers/price-list-branch-assignment.serializer';
import { PriceListSerializer } from './serializers/price-list.serializer';
import { ProductPriceSerializer } from './serializers/product-price.serializer';
import { PriceListBranchAssignmentsService } from './services/price-list-branch-assignments.service';
import { PricingValidationService } from './services/pricing-validation.service';
import { PricingService } from './services/pricing.service';
import { ProductsSubModule } from './products.sub-module';
import { CreatePriceListBranchAssignmentUseCase } from './use-cases/create-price-list-branch-assignment.use-case';
import { CreatePriceListUseCase } from './use-cases/create-price-list.use-case';
import { CreateProductPriceUseCase } from './use-cases/create-product-price.use-case';
import { DeletePriceListBranchAssignmentUseCase } from './use-cases/delete-price-list-branch-assignment.use-case';
import { DeletePriceListUseCase } from './use-cases/delete-price-list.use-case';
import { DeleteProductPriceUseCase } from './use-cases/delete-product-price.use-case';
import { GetBranchPriceListsQueryUseCase } from './use-cases/get-branch-price-lists.query.use-case';
import { GetPriceListBranchAssignmentQueryUseCase } from './use-cases/get-price-list-branch-assignment.query.use-case';
import { GetPriceListBranchAssignmentsQueryUseCase } from './use-cases/get-price-list-branch-assignments.query.use-case';
import { GetPriceListQueryUseCase } from './use-cases/get-price-list.query.use-case';
import { GetPriceListsListQueryUseCase } from './use-cases/get-price-lists-list.query.use-case';
import { GetProductPriceQueryUseCase } from './use-cases/get-product-price.query.use-case';
import { GetProductPricesQueryUseCase } from './use-cases/get-product-prices.query.use-case';
import { UpdatePriceListBranchAssignmentUseCase } from './use-cases/update-price-list-branch-assignment.use-case';
import { UpdatePriceListUseCase } from './use-cases/update-price-list.use-case';
import { UpdateProductPriceUseCase } from './use-cases/update-product-price.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      PriceList,
      PriceListBranchAssignment,
      ProductPrice,
    ]),
    BranchesModule,
    InventoryValidationSubModule,
    PricingValidationSubModule,
    forwardRef(() => ProductsSubModule),
  ],
  controllers: [
    PriceListsController,
    PriceListBranchAssignmentsController,
    PriceListBranchAssignmentItemsController,
    ProductPricesController,
    BranchPriceListsController,
  ],
  providers: [
    PriceListsRepository,
    PriceListBranchAssignmentsRepository,
    ProductPricesRepository,
    PriceListBranchAssignmentPolicy,
    PriceListLifecyclePolicy,
    ProductPricePolicy,
    PriceListSerializer,
    PriceListBranchAssignmentSerializer,
    ProductPriceSerializer,
    PricingService,
    PriceListBranchAssignmentsService,
    GetPriceListsListQueryUseCase,
    GetPriceListQueryUseCase,
    CreatePriceListUseCase,
    UpdatePriceListUseCase,
    DeletePriceListUseCase,
    GetProductPricesQueryUseCase,
    GetProductPriceQueryUseCase,
    CreateProductPriceUseCase,
    UpdateProductPriceUseCase,
    DeleteProductPriceUseCase,
    GetPriceListBranchAssignmentsQueryUseCase,
    GetBranchPriceListsQueryUseCase,
    GetPriceListBranchAssignmentQueryUseCase,
    CreatePriceListBranchAssignmentUseCase,
    UpdatePriceListBranchAssignmentUseCase,
    DeletePriceListBranchAssignmentUseCase,
  ],
  exports: [
    PricingService,
    PriceListsRepository,
    PriceListBranchAssignmentsRepository,
    ProductPricesRepository,
  ],
})
export class PricingSubModule {}
