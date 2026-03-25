import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { ContactsModule } from '../contacts/contacts.module';
import { Brand } from './entities/brand.entity';
import { InventoryBalance } from './entities/inventory-balance.entity';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryMovementLine } from './entities/inventory-movement-line.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { MeasurementUnit } from './entities/measurement-unit.entity';
import { PriceList } from './entities/price-list.entity';
import { ProductPrice } from './entities/product-price.entity';
import { ProductCategory } from './entities/product-category.entity';
import { Product } from './entities/product.entity';
import { PromotionItem } from './entities/promotion-item.entity';
import { Promotion } from './entities/promotion.entity';
import { TaxProfile } from './entities/tax-profile.entity';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { WarehouseStock } from './entities/warehouse-stock.entity';
import { Warehouse } from './entities/warehouse.entity';
import { WarrantyProfile } from './entities/warranty-profile.entity';
import { BrandsRepository } from './repositories/brands.repository';
import { InventoryBalancesRepository } from './repositories/inventory-balances.repository';
import { InventoryLotsRepository } from './repositories/inventory-lots.repository';
import { InventoryMovementLinesRepository } from './repositories/inventory-movement-lines.repository';
import { InventoryMovementsRepository } from './repositories/inventory-movements.repository';
import { MeasurementUnitsRepository } from './repositories/measurement-units.repository';
import { PriceListsRepository } from './repositories/price-lists.repository';
import { ProductPricesRepository } from './repositories/product-prices.repository';
import { ProductCategoriesRepository } from './repositories/product-categories.repository';
import { ProductsRepository } from './repositories/products.repository';
import { PromotionsRepository } from './repositories/promotions.repository';
import { TaxProfilesRepository } from './repositories/tax-profiles.repository';
import { WarehouseLocationsRepository } from './repositories/warehouse-locations.repository';
import { WarehouseStockRepository } from './repositories/warehouse-stock.repository';
import { WarehousesRepository } from './repositories/warehouses.repository';
import { WarrantyProfilesRepository } from './repositories/warranty-profiles.repository';
import { InventoryValidationService } from './services/inventory-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Brand,
      InventoryBalance,
      InventoryLot,
      InventoryMovement,
      InventoryMovementLine,
      MeasurementUnit,
      PriceList,
      ProductPrice,
      ProductCategory,
      Product,
      Promotion,
      PromotionItem,
      TaxProfile,
      Warehouse,
      WarehouseLocation,
      WarehouseStock,
      WarrantyProfile,
    ]),
    BranchesModule,
    ContactsModule,
  ],
  providers: [
    BrandsRepository,
    InventoryBalancesRepository,
    InventoryLotsRepository,
    InventoryMovementLinesRepository,
    InventoryMovementsRepository,
    MeasurementUnitsRepository,
    PriceListsRepository,
    ProductPricesRepository,
    ProductCategoriesRepository,
    ProductsRepository,
    PromotionsRepository,
    TaxProfilesRepository,
    WarehouseLocationsRepository,
    WarehouseStockRepository,
    WarehousesRepository,
    WarrantyProfilesRepository,
    InventoryValidationService,
  ],
  exports: [
    BrandsRepository,
    InventoryBalancesRepository,
    InventoryLotsRepository,
    InventoryMovementLinesRepository,
    InventoryMovementsRepository,
    InventoryValidationService,
    MeasurementUnitsRepository,
    PriceListsRepository,
    ProductPricesRepository,
    ProductCategoriesRepository,
    ProductsRepository,
    PromotionsRepository,
    TaxProfilesRepository,
    WarehouseLocationsRepository,
    WarehouseStockRepository,
    WarehousesRepository,
    WarrantyProfilesRepository,
  ],
})
export class InventoryValidationSubModule {}
