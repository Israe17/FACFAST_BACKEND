import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { ContactsModule } from '../contacts/contacts.module';
import { BrandsController } from './controllers/brands.controller';
import { InventoryLotsController } from './controllers/inventory-lots.controller';
import { InventoryMovementsController } from './controllers/inventory-movements.controller';
import { MeasurementUnitsController } from './controllers/measurement-units.controller';
import { PriceListsController } from './controllers/price-lists.controller';
import { ProductCategoriesController } from './controllers/product-categories.controller';
import { ProductPricesController } from './controllers/product-prices.controller';
import { ProductSerialsController } from './controllers/product-serials.controller';
import { ProductVariantsController } from './controllers/product-variants.controller';
import { ProductsController } from './controllers/products.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { TaxProfilesController } from './controllers/tax-profiles.controller';
import { VariantAttributesController } from './controllers/variant-attributes.controller';
import { WarehouseLocationsController } from './controllers/warehouse-locations.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { WarehouseStockController } from './controllers/warehouse-stock.controller';
import { WarrantyProfilesController } from './controllers/warranty-profiles.controller';
import { Brand } from './entities/brand.entity';
import { InventoryBalance } from './entities/inventory-balance.entity';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryMovementHeader } from './entities/inventory-movement-header.entity';
import { InventoryMovementLine } from './entities/inventory-movement-line.entity';
import { MeasurementUnit } from './entities/measurement-unit.entity';
import { PriceList } from './entities/price-list.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductPrice } from './entities/product-price.entity';
import { Product } from './entities/product.entity';
import { ProductSerial } from './entities/product-serial.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { PromotionItem } from './entities/promotion-item.entity';
import { Promotion } from './entities/promotion.entity';
import { SerialEvent } from './entities/serial-event.entity';
import { TaxProfile } from './entities/tax-profile.entity';
import { VariantAttribute } from './entities/variant-attribute.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { WarehouseBranchLink } from './entities/warehouse-branch-link.entity';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { WarehouseStock } from './entities/warehouse-stock.entity';
import { Warehouse } from './entities/warehouse.entity';
import { WarrantyProfile } from './entities/warranty-profile.entity';
import { BrandsRepository } from './repositories/brands.repository';
import { InventoryBalancesRepository } from './repositories/inventory-balances.repository';
import { InventoryLotsRepository } from './repositories/inventory-lots.repository';
import { InventoryMovementHeadersRepository } from './repositories/inventory-movement-headers.repository';
import { InventoryMovementLinesRepository } from './repositories/inventory-movement-lines.repository';
import { InventoryMovementsRepository } from './repositories/inventory-movements.repository';
import { MeasurementUnitsRepository } from './repositories/measurement-units.repository';
import { PriceListsRepository } from './repositories/price-lists.repository';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { ProductPricesRepository } from './repositories/product-prices.repository';
import { ProductSerialsRepository } from './repositories/product-serials.repository';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { PromotionsRepository } from './repositories/promotions.repository';
import { TaxProfilesRepository } from './repositories/tax-profiles.repository';
import { WarehouseBranchLinksRepository } from './repositories/warehouse-branch-links.repository';
import { WarehouseLocationsRepository } from './repositories/warehouse-locations.repository';
import { WarehousesRepository } from './repositories/warehouses.repository';
import { WarehouseStockRepository } from './repositories/warehouse-stock.repository';
import { WarrantyProfilesRepository } from './repositories/warranty-profiles.repository';
import { BrandsService } from './services/brands.service';
import { InventoryAdjustmentsService } from './services/inventory-adjustments.service';
import { InventoryLotsService } from './services/inventory-lots.service';
import { InventoryMovementsService } from './services/inventory-movements.service';
import { InventoryLedgerService } from './services/inventory-ledger.service';
import { InventoryTransfersService } from './services/inventory-transfers.service';
import { InventoryValidationService } from './services/inventory-validation.service';
import { MeasurementUnitsService } from './services/measurement-units.service';
import { PricingService } from './services/pricing.service';
import { ProductCategoriesService } from './services/product-categories.service';
import { ProductSerialsService } from './services/product-serials.service';
import { ProductVariantsService } from './services/product-variants.service';
import { ProductsService } from './services/products.service';
import { PromotionsService } from './services/promotions.service';
import { TaxProfilesService } from './services/tax-profiles.service';
import { VariantAttributesService } from './services/variant-attributes.service';
import { WarehousesService } from './services/warehouses.service';
import { WarehouseStockService } from './services/warehouse-stock.service';
import { WarrantyProfilesService } from './services/warranty-profiles.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ProductCategory,
      Brand,
      MeasurementUnit,
      TaxProfile,
      Product,
      ProductVariant,
      PriceList,
      ProductPrice,
      WarrantyProfile,
      Promotion,
      PromotionItem,
      Warehouse,
      WarehouseBranchLink,
      WarehouseLocation,
      WarehouseStock,
      InventoryBalance,
      InventoryLot,
      InventoryMovement,
      InventoryMovementHeader,
      InventoryMovementLine,
      VariantAttribute,
      VariantAttributeValue,
      ProductSerial,
      SerialEvent,
    ]),
    BranchesModule,
    ContactsModule,
  ],
  controllers: [
    ProductCategoriesController,
    BrandsController,
    MeasurementUnitsController,
    TaxProfilesController,
    ProductsController,
    ProductVariantsController,
    VariantAttributesController,
    PriceListsController,
    ProductPricesController,
    ProductSerialsController,
    WarrantyProfilesController,
    PromotionsController,
    WarehousesController,
    WarehouseLocationsController,
    WarehouseStockController,
    InventoryLotsController,
    InventoryMovementsController,
  ],
  providers: [
    ProductCategoriesRepository,
    BrandsRepository,
    MeasurementUnitsRepository,
    TaxProfilesRepository,
    ProductsRepository,
    ProductVariantsRepository,
    ProductSerialsRepository,
    PriceListsRepository,
    ProductPricesRepository,
    WarrantyProfilesRepository,
    PromotionsRepository,
    WarehousesRepository,
    WarehouseBranchLinksRepository,
    WarehouseLocationsRepository,
    WarehouseStockRepository,
    InventoryBalancesRepository,
    InventoryLotsRepository,
    InventoryMovementsRepository,
    InventoryMovementHeadersRepository,
    InventoryMovementLinesRepository,
    InventoryLedgerService,
    InventoryValidationService,
    ProductCategoriesService,
    BrandsService,
    MeasurementUnitsService,
    TaxProfilesService,
    ProductsService,
    ProductVariantsService,
    VariantAttributesService,
    ProductSerialsService,
    PricingService,
    WarrantyProfilesService,
    PromotionsService,
    WarehousesService,
    WarehouseStockService,
    InventoryAdjustmentsService,
    InventoryLotsService,
    InventoryMovementsService,
    InventoryTransfersService,
  ],
  exports: [
    ProductsService,
    ProductVariantsService,
    PricingService,
    WarehousesService,
    WarehouseStockService,
    InventoryLotsService,
    InventoryMovementsService,
  ],
})
export class InventoryModule {}
