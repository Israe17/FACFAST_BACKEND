import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { BrandsController } from './controllers/brands.controller';
import { MeasurementUnitsController } from './controllers/measurement-units.controller';
import { ProductCategoriesController } from './controllers/product-categories.controller';
import { ProductSerialsController } from './controllers/product-serials.controller';
import { ProductVariantsController } from './controllers/product-variants.controller';
import { ProductVariantSerialsController } from './controllers/product-variant-serials.controller';
import { ProductsController } from './controllers/products.controller';
import { TaxProfilesController } from './controllers/tax-profiles.controller';
import { VariantAttributesController } from './controllers/variant-attributes.controller';
import { WarrantyProfilesController } from './controllers/warranty-profiles.controller';
import { Brand } from './entities/brand.entity';
import { MeasurementUnit } from './entities/measurement-unit.entity';
import { Product } from './entities/product.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductSerial } from './entities/product-serial.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { SerialEvent } from './entities/serial-event.entity';
import { TaxProfile } from './entities/tax-profile.entity';
import { VariantAttribute } from './entities/variant-attribute.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { WarrantyProfile } from './entities/warranty-profile.entity';
import { InventoryValidationSubModule } from './inventory-validation.sub-module';
import { BrandsRepository } from './repositories/brands.repository';
import { MeasurementUnitsRepository } from './repositories/measurement-units.repository';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { ProductSerialsRepository } from './repositories/product-serials.repository';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { TaxProfilesRepository } from './repositories/tax-profiles.repository';
import { WarrantyProfilesRepository } from './repositories/warranty-profiles.repository';
import { TaxProfileRulesPolicy } from './policies/tax-profile-rules.policy';
import { ProductCategorySerializer } from './serializers/product-category.serializer';
import { ProductSerializer } from './serializers/product.serializer';
import { TaxProfileSerializer } from './serializers/tax-profile.serializer';
import { BrandsService } from './services/brands.service';
import { MeasurementUnitsService } from './services/measurement-units.service';
import { ProductCategoriesService } from './services/product-categories.service';
import { ProductSerialsService } from './services/product-serials.service';
import { ProductVariantsService } from './services/product-variants.service';
import { ProductsService } from './services/products.service';
import { TaxProfilesService } from './services/tax-profiles.service';
import { VariantAttributesService } from './services/variant-attributes.service';
import { WarrantyProfilesService } from './services/warranty-profiles.service';
import { PricingSubModule } from './pricing.sub-module';
import { CreateProductCategoryUseCase } from './use-cases/create-product-category.use-case';
import { CreateTaxProfileUseCase } from './use-cases/create-tax-profile.use-case';
import { DeleteProductCategoryUseCase } from './use-cases/delete-product-category.use-case';
import { EnsureTaxProfileForCabysUseCase } from './use-cases/ensure-tax-profile-for-cabys.use-case';
import { GetProductCategoriesQueryUseCase } from './use-cases/get-product-categories.query.use-case';
import { GetProductCategoryQueryUseCase } from './use-cases/get-product-category.query.use-case';
import { GetProductCategoryTreeQueryUseCase } from './use-cases/get-product-category-tree.query.use-case';
import { GetProductsCursorQueryUseCase } from './use-cases/get-products-cursor.query.use-case';
import { GetTaxProfileQueryUseCase } from './use-cases/get-tax-profile.query.use-case';
import { GetTaxProfilesQueryUseCase } from './use-cases/get-tax-profiles.query.use-case';
import { UpdateProductCategoryUseCase } from './use-cases/update-product-category.use-case';
import { UpdateTaxProfileUseCase } from './use-cases/update-tax-profile.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      MeasurementUnit,
      Product,
      ProductCategory,
      ProductSerial,
      ProductVariant,
      SerialEvent,
      TaxProfile,
      VariantAttribute,
      VariantAttributeValue,
      WarrantyProfile,
    ]),
    BranchesModule,
    InventoryValidationSubModule,
    forwardRef(() => PricingSubModule),
  ],
  controllers: [
    BrandsController,
    MeasurementUnitsController,
    ProductCategoriesController,
    ProductsController,
    ProductVariantsController,
    ProductSerialsController,
    ProductVariantSerialsController,
    TaxProfilesController,
    VariantAttributesController,
    WarrantyProfilesController,
  ],
  providers: [
    BrandsRepository,
    MeasurementUnitsRepository,
    ProductCategoriesRepository,
    ProductSerialsRepository,
    ProductVariantsRepository,
    ProductsRepository,
    TaxProfilesRepository,
    WarrantyProfilesRepository,
    ProductCategorySerializer,
    ProductSerializer,
    TaxProfileSerializer,
    TaxProfileRulesPolicy,
    BrandsService,
    MeasurementUnitsService,
    ProductCategoriesService,
    ProductSerialsService,
    ProductVariantsService,
    ProductsService,
    TaxProfilesService,
    VariantAttributesService,
    WarrantyProfilesService,
    EnsureTaxProfileForCabysUseCase,
    GetTaxProfilesQueryUseCase,
    GetTaxProfileQueryUseCase,
    CreateTaxProfileUseCase,
    UpdateTaxProfileUseCase,
    GetProductCategoriesQueryUseCase,
    GetProductCategoryQueryUseCase,
    GetProductCategoryTreeQueryUseCase,
    CreateProductCategoryUseCase,
    UpdateProductCategoryUseCase,
    DeleteProductCategoryUseCase,
    GetProductsCursorQueryUseCase,
  ],
  exports: [
    ProductsService,
    ProductVariantsService,
    ProductsRepository,
    ProductVariantsRepository,
    ProductSerialsRepository,
    TaxProfilesRepository,
    MeasurementUnitsRepository,
    BrandsRepository,
    ProductCategoriesRepository,
    WarrantyProfilesRepository,
    ProductSerializer,
  ],
})
export class ProductsSubModule {}
