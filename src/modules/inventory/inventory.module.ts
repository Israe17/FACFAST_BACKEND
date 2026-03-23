import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrder } from '../sales/entities/sale-order.entity';
import { BranchesModule } from '../branches/branches.module';
import { ContactsModule } from '../contacts/contacts.module';
import { BrandsController } from './controllers/brands.controller';
import { BranchPriceListsController } from './controllers/branch-price-lists.controller';
import { BranchPromotionsController } from './controllers/branch-promotions.controller';
import { InventoryLotsController } from './controllers/inventory-lots.controller';
import { InventoryMovementsController } from './controllers/inventory-movements.controller';
import { MeasurementUnitsController } from './controllers/measurement-units.controller';
import { PriceListsController } from './controllers/price-lists.controller';
import { PriceListBranchAssignmentsController } from './controllers/price-list-branch-assignments.controller';
import { ProductCategoriesController } from './controllers/product-categories.controller';
import { ProductPricesController } from './controllers/product-prices.controller';
import { ProductSerialsController } from './controllers/product-serials.controller';
import { ProductVariantsController } from './controllers/product-variants.controller';
import { ProductsController } from './controllers/products.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { PromotionBranchAssignmentsController } from './controllers/promotion-branch-assignments.controller';
import { TaxProfilesController } from './controllers/tax-profiles.controller';
import { VariantAttributesController } from './controllers/variant-attributes.controller';
import { WarehouseLocationsController } from './controllers/warehouse-locations.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { WarehouseStockController } from './controllers/warehouse-stock.controller';
import { RoutesController } from './controllers/routes.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { WarrantyProfilesController } from './controllers/warranty-profiles.controller';
import { DispatchOrdersController } from './controllers/dispatch-orders.controller';
import { ZonesController } from './controllers/zones.controller';
import { Brand } from './entities/brand.entity';
import { InventoryBalance } from './entities/inventory-balance.entity';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryMovementHeader } from './entities/inventory-movement-header.entity';
import { InventoryMovementLine } from './entities/inventory-movement-line.entity';
import { MeasurementUnit } from './entities/measurement-unit.entity';
import { PriceList } from './entities/price-list.entity';
import { PriceListBranchAssignment } from './entities/price-list-branch-assignment.entity';
import { ProductCategory } from './entities/product-category.entity';
import { ProductPrice } from './entities/product-price.entity';
import { Product } from './entities/product.entity';
import { ProductSerial } from './entities/product-serial.entity';
import { ProductVariant } from './entities/product-variant.entity';
import { PromotionItem } from './entities/promotion-item.entity';
import { PromotionBranchAssignment } from './entities/promotion-branch-assignment.entity';
import { Promotion } from './entities/promotion.entity';
import { Route } from './entities/route.entity';
import { SerialEvent } from './entities/serial-event.entity';
import { TaxProfile } from './entities/tax-profile.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VariantAttribute } from './entities/variant-attribute.entity';
import { VariantAttributeValue } from './entities/variant-attribute-value.entity';
import { WarehouseBranchLink } from './entities/warehouse-branch-link.entity';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { WarehouseStock } from './entities/warehouse-stock.entity';
import { Warehouse } from './entities/warehouse.entity';
import { WarrantyProfile } from './entities/warranty-profile.entity';
import { DispatchOrder } from './entities/dispatch-order.entity';
import { DispatchStop } from './entities/dispatch-stop.entity';
import { DispatchExpense } from './entities/dispatch-expense.entity';
import { Zone } from './entities/zone.entity';
import { BrandsRepository } from './repositories/brands.repository';
import { InventoryBalancesRepository } from './repositories/inventory-balances.repository';
import { InventoryLotsRepository } from './repositories/inventory-lots.repository';
import { InventoryMovementHeadersRepository } from './repositories/inventory-movement-headers.repository';
import { InventoryMovementLinesRepository } from './repositories/inventory-movement-lines.repository';
import { InventoryMovementsRepository } from './repositories/inventory-movements.repository';
import { MeasurementUnitsRepository } from './repositories/measurement-units.repository';
import { PriceListsRepository } from './repositories/price-lists.repository';
import { PriceListBranchAssignmentsRepository } from './repositories/price-list-branch-assignments.repository';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { ProductPricesRepository } from './repositories/product-prices.repository';
import { ProductSerialsRepository } from './repositories/product-serials.repository';
import { ProductVariantsRepository } from './repositories/product-variants.repository';
import { ProductsRepository } from './repositories/products.repository';
import { PromotionBranchAssignmentsRepository } from './repositories/promotion-branch-assignments.repository';
import { PromotionsRepository } from './repositories/promotions.repository';
import { RoutesRepository } from './repositories/routes.repository';
import { TaxProfilesRepository } from './repositories/tax-profiles.repository';
import { WarehouseBranchLinksRepository } from './repositories/warehouse-branch-links.repository';
import { WarehouseLocationsRepository } from './repositories/warehouse-locations.repository';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { WarehousesRepository } from './repositories/warehouses.repository';
import { WarehouseStockRepository } from './repositories/warehouse-stock.repository';
import { WarrantyProfilesRepository } from './repositories/warranty-profiles.repository';
import { DispatchOrdersRepository } from './repositories/dispatch-orders.repository';
import { ZonesRepository } from './repositories/zones.repository';
import { BrandsService } from './services/brands.service';
import { InventoryAdjustmentsService } from './services/inventory-adjustments.service';
import { InventoryLotsService } from './services/inventory-lots.service';
import { InventoryMovementsService } from './services/inventory-movements.service';
import { InventoryLedgerService } from './services/inventory-ledger.service';
import { InventoryTransfersService } from './services/inventory-transfers.service';
import { InventoryValidationService } from './services/inventory-validation.service';
import { MeasurementUnitsService } from './services/measurement-units.service';
import { PricingService } from './services/pricing.service';
import { PriceListBranchAssignmentsService } from './services/price-list-branch-assignments.service';
import { ProductCategoriesService } from './services/product-categories.service';
import { ProductSerialsService } from './services/product-serials.service';
import { ProductVariantsService } from './services/product-variants.service';
import { PromotionBranchAssignmentsService } from './services/promotion-branch-assignments.service';
import { ProductsService } from './services/products.service';
import { PromotionsService } from './services/promotions.service';
import { RoutesService } from './services/routes.service';
import { TaxProfilesService } from './services/tax-profiles.service';
import { VariantAttributesService } from './services/variant-attributes.service';
import { VehiclesService } from './services/vehicles.service';
import { WarehousesService } from './services/warehouses.service';
import { WarehouseStockService } from './services/warehouse-stock.service';
import { WarrantyProfilesService } from './services/warranty-profiles.service';
import { DispatchOrdersService } from './services/dispatch-orders.service';
import { ZonesService } from './services/zones.service';

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
      PriceListBranchAssignment,
      ProductPrice,
      WarrantyProfile,
      Promotion,
      PromotionItem,
      PromotionBranchAssignment,
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
      Zone,
      Vehicle,
      Route,
      DispatchOrder,
      DispatchStop,
      DispatchExpense,
      SaleOrder,
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
    PriceListBranchAssignmentsController,
    ProductPricesController,
    ProductSerialsController,
    WarrantyProfilesController,
    PromotionsController,
    PromotionBranchAssignmentsController,
    WarehousesController,
    WarehouseLocationsController,
    WarehouseStockController,
    InventoryLotsController,
    InventoryMovementsController,
    BranchPriceListsController,
    BranchPromotionsController,
    ZonesController,
    VehiclesController,
    RoutesController,
    DispatchOrdersController,
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
    PriceListBranchAssignmentsRepository,
    ProductPricesRepository,
    WarrantyProfilesRepository,
    PromotionBranchAssignmentsRepository,
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
    PriceListBranchAssignmentsService,
    WarrantyProfilesService,
    PromotionsService,
    PromotionBranchAssignmentsService,
    WarehousesService,
    WarehouseStockService,
    InventoryAdjustmentsService,
    InventoryLotsService,
    InventoryMovementsService,
    InventoryTransfersService,
    ZonesRepository,
    ZonesService,
    VehiclesRepository,
    VehiclesService,
    RoutesRepository,
    RoutesService,
    DispatchOrdersRepository,
    DispatchOrdersService,
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
