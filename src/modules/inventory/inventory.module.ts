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
import { PriceListBranchAssignmentItemsController } from './controllers/price-list-branch-assignment-items.controller';
import { PriceListBranchAssignmentsController } from './controllers/price-list-branch-assignments.controller';
import { ProductCategoriesController } from './controllers/product-categories.controller';
import { ProductPricesController } from './controllers/product-prices.controller';
import { ProductSerialsController } from './controllers/product-serials.controller';
import { ProductVariantSerialsController } from './controllers/product-variant-serials.controller';
import { ProductVariantsController } from './controllers/product-variants.controller';
import { ProductsController } from './controllers/products.controller';
import { PromotionsController } from './controllers/promotions.controller';
import { PromotionBranchAssignmentItemsController } from './controllers/promotion-branch-assignment-items.controller';
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
import { InventoryReservation } from './entities/inventory-reservation.entity';
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
import { InventoryReservationsRepository } from './repositories/inventory-reservations.repository';
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
import { DispatchOrderAccessPolicy } from './policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from './policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from './policies/dispatch-sale-order.policy';
import { InventoryLotAccessPolicy } from './policies/inventory-lot-access.policy';
import { InventoryMovementAccessPolicy } from './policies/inventory-movement-access.policy';
import { InventoryMovementLifecyclePolicy } from './policies/inventory-movement-lifecycle.policy';
import { PriceListBranchAssignmentPolicy } from './policies/price-list-branch-assignment.policy';
import { PriceListLifecyclePolicy } from './policies/price-list-lifecycle.policy';
import { ProductPricePolicy } from './policies/product-price.policy';
import { PromotionBranchAssignmentPolicy } from './policies/promotion-branch-assignment.policy';
import { PromotionDefinitionPolicy } from './policies/promotion-definition.policy';
import { DispatchOrderSerializer } from './serializers/dispatch-order.serializer';
import { InventoryLotSerializer } from './serializers/inventory-lot.serializer';
import { InventoryMovementSerializer } from './serializers/inventory-movement.serializer';
import { PriceListBranchAssignmentSerializer } from './serializers/price-list-branch-assignment.serializer';
import { PriceListSerializer } from './serializers/price-list.serializer';
import { ProductPriceSerializer } from './serializers/product-price.serializer';
import { ProductSerializer } from './serializers/product.serializer';
import { PromotionBranchAssignmentSerializer } from './serializers/promotion-branch-assignment.serializer';
import { PromotionSerializer } from './serializers/promotion.serializer';
import { WarehouseAccessPolicy } from './policies/warehouse-access.policy';
import { WarehouseLocationSerializer } from './serializers/warehouse-location.serializer';
import { WarehouseSerializer } from './serializers/warehouse.serializer';
import { WarehouseStockSerializer } from './serializers/warehouse-stock.serializer';
import { BrandsService } from './services/brands.service';
import { InventoryAdjustmentsService } from './services/inventory-adjustments.service';
import { InventoryLotsService } from './services/inventory-lots.service';
import { InventoryMovementsService } from './services/inventory-movements.service';
import { InventoryLedgerService } from './services/inventory-ledger.service';
import { InventoryReservationsService } from './services/inventory-reservations.service';
import { InventoryTransfersService } from './services/inventory-transfers.service';
import { InventoryValidationService } from './services/inventory-validation.service';
import { MeasurementUnitsService } from './services/measurement-units.service';
import { PricingService } from './services/pricing.service';
import { PricingValidationService } from './services/pricing-validation.service';
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
import { WarehouseStockProjectionService } from './services/warehouse-stock-projection.service';
import { WarrantyProfilesService } from './services/warranty-profiles.service';
import { DispatchOrdersService } from './services/dispatch-orders.service';
import { ZonesService } from './services/zones.service';
import { AddDispatchExpenseUseCase } from './use-cases/add-dispatch-expense.use-case';
import { AddDispatchStopUseCase } from './use-cases/add-dispatch-stop.use-case';
import { AdjustInventoryUseCase } from './use-cases/adjust-inventory.use-case';
import { CancelDispatchOrderUseCase } from './use-cases/cancel-dispatch-order.use-case';
import { CancelInventoryMovementUseCase } from './use-cases/cancel-inventory-movement.use-case';
import { CreateInventoryLotUseCase } from './use-cases/create-inventory-lot.use-case';
import { CreatePriceListBranchAssignmentUseCase } from './use-cases/create-price-list-branch-assignment.use-case';
import { CreatePriceListUseCase } from './use-cases/create-price-list.use-case';
import { CreateProductPriceUseCase } from './use-cases/create-product-price.use-case';
import { CreatePromotionBranchAssignmentUseCase } from './use-cases/create-promotion-branch-assignment.use-case';
import { CreatePromotionUseCase } from './use-cases/create-promotion.use-case';
import { CreateDispatchOrderUseCase } from './use-cases/create-dispatch-order.use-case';
import { CreateWarehouseLocationUseCase } from './use-cases/create-warehouse-location.use-case';
import { CreateWarehouseUseCase } from './use-cases/create-warehouse.use-case';
import { DeactivateInventoryLotUseCase } from './use-cases/deactivate-inventory-lot.use-case';
import { DeactivateWarehouseUseCase } from './use-cases/deactivate-warehouse.use-case';
import { DeletePriceListBranchAssignmentUseCase } from './use-cases/delete-price-list-branch-assignment.use-case';
import { DeletePriceListUseCase } from './use-cases/delete-price-list.use-case';
import { DeleteProductPriceUseCase } from './use-cases/delete-product-price.use-case';
import { DeletePromotionBranchAssignmentUseCase } from './use-cases/delete-promotion-branch-assignment.use-case';
import { DeletePromotionUseCase } from './use-cases/delete-promotion.use-case';
import { GetBranchPriceListsQueryUseCase } from './use-cases/get-branch-price-lists.query.use-case';
import { GetBranchPromotionsQueryUseCase } from './use-cases/get-branch-promotions.query.use-case';
import { GetInventoryLotQueryUseCase } from './use-cases/get-inventory-lot.query.use-case';
import { GetInventoryLotsCursorQueryUseCase } from './use-cases/get-inventory-lots-cursor.query.use-case';
import { GetInventoryLotsListQueryUseCase } from './use-cases/get-inventory-lots-list.query.use-case';
import { GetInventoryLotsPageQueryUseCase } from './use-cases/get-inventory-lots-page.query.use-case';
import { GetInventoryMovementQueryUseCase } from './use-cases/get-inventory-movement.query.use-case';
import { GetInventoryMovementsCursorQueryUseCase } from './use-cases/get-inventory-movements-cursor.query.use-case';
import { GetInventoryMovementsListQueryUseCase } from './use-cases/get-inventory-movements-list.query.use-case';
import { GetInventoryMovementsPageQueryUseCase } from './use-cases/get-inventory-movements-page.query.use-case';
import { GetDispatchOrderQueryUseCase } from './use-cases/get-dispatch-order.query.use-case';
import { GetDispatchOrdersCursorQueryUseCase } from './use-cases/get-dispatch-orders-cursor.query.use-case';
import { GetDispatchOrdersListQueryUseCase } from './use-cases/get-dispatch-orders-list.query.use-case';
import { GetPriceListBranchAssignmentQueryUseCase } from './use-cases/get-price-list-branch-assignment.query.use-case';
import { GetPriceListBranchAssignmentsQueryUseCase } from './use-cases/get-price-list-branch-assignments.query.use-case';
import { GetPriceListQueryUseCase } from './use-cases/get-price-list.query.use-case';
import { GetPriceListsListQueryUseCase } from './use-cases/get-price-lists-list.query.use-case';
import { GetProductPriceQueryUseCase } from './use-cases/get-product-price.query.use-case';
import { GetProductPricesQueryUseCase } from './use-cases/get-product-prices.query.use-case';
import { GetProductsCursorQueryUseCase } from './use-cases/get-products-cursor.query.use-case';
import { GetPromotionBranchAssignmentQueryUseCase } from './use-cases/get-promotion-branch-assignment.query.use-case';
import { GetPromotionBranchAssignmentsQueryUseCase } from './use-cases/get-promotion-branch-assignments.query.use-case';
import { GetPromotionQueryUseCase } from './use-cases/get-promotion.query.use-case';
import { GetPromotionsListQueryUseCase } from './use-cases/get-promotions-list.query.use-case';
import { GetWarehouseLocationQueryUseCase } from './use-cases/get-warehouse-location.query.use-case';
import { GetWarehouseLocationsQueryUseCase } from './use-cases/get-warehouse-locations.query.use-case';
import { GetWarehouseQueryUseCase } from './use-cases/get-warehouse.query.use-case';
import { GetWarehousesListQueryUseCase } from './use-cases/get-warehouses-list.query.use-case';
import { GetWarehouseStockByWarehouseCursorQueryUseCase } from './use-cases/get-warehouse-stock-by-warehouse-cursor.query.use-case';
import { GetWarehouseStockByWarehouseQueryUseCase } from './use-cases/get-warehouse-stock-by-warehouse.query.use-case';
import { GetWarehouseStockCursorQueryUseCase } from './use-cases/get-warehouse-stock-cursor.query.use-case';
import { GetWarehouseStockQueryUseCase } from './use-cases/get-warehouse-stock.query.use-case';
import { MarkDispatchOrderCompletedUseCase } from './use-cases/mark-dispatch-order-completed.use-case';
import { MarkDispatchOrderDispatchedUseCase } from './use-cases/mark-dispatch-order-dispatched.use-case';
import { RemoveDispatchExpenseUseCase } from './use-cases/remove-dispatch-expense.use-case';
import { RemoveDispatchStopUseCase } from './use-cases/remove-dispatch-stop.use-case';
import { TransferInventoryUseCase } from './use-cases/transfer-inventory.use-case';
import { UpdateInventoryLotUseCase } from './use-cases/update-inventory-lot.use-case';
import { UpdateDispatchOrderUseCase } from './use-cases/update-dispatch-order.use-case';
import { UpdatePriceListBranchAssignmentUseCase } from './use-cases/update-price-list-branch-assignment.use-case';
import { UpdatePriceListUseCase } from './use-cases/update-price-list.use-case';
import { UpdateProductPriceUseCase } from './use-cases/update-product-price.use-case';
import { UpdatePromotionBranchAssignmentUseCase } from './use-cases/update-promotion-branch-assignment.use-case';
import { UpdatePromotionUseCase } from './use-cases/update-promotion.use-case';
import { UpdateWarehouseLocationUseCase } from './use-cases/update-warehouse-location.use-case';
import { UpdateWarehouseUseCase } from './use-cases/update-warehouse.use-case';

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
      InventoryReservation,
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
    PriceListBranchAssignmentItemsController,
    ProductPricesController,
    ProductSerialsController,
    ProductVariantSerialsController,
    WarrantyProfilesController,
    PromotionsController,
    PromotionBranchAssignmentsController,
    PromotionBranchAssignmentItemsController,
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
    InventoryReservationsRepository,
    DispatchOrderAccessPolicy,
    DispatchOrderLifecyclePolicy,
    DispatchSaleOrderPolicy,
    InventoryLotAccessPolicy,
    InventoryMovementAccessPolicy,
    InventoryMovementLifecyclePolicy,
    PriceListBranchAssignmentPolicy,
    PriceListLifecyclePolicy,
    ProductPricePolicy,
    PromotionBranchAssignmentPolicy,
    PromotionDefinitionPolicy,
    DispatchOrderSerializer,
    InventoryLotSerializer,
    InventoryMovementSerializer,
    PriceListBranchAssignmentSerializer,
    PriceListSerializer,
    ProductPriceSerializer,
    ProductSerializer,
    PromotionBranchAssignmentSerializer,
    PromotionSerializer,
    WarehouseAccessPolicy,
    WarehouseSerializer,
    WarehouseLocationSerializer,
    WarehouseStockSerializer,
    WarehouseStockProjectionService,
    InventoryLedgerService,
    InventoryReservationsService,
    InventoryValidationService,
    PricingValidationService,
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
    GetDispatchOrdersListQueryUseCase,
    GetDispatchOrdersCursorQueryUseCase,
    GetDispatchOrderQueryUseCase,
    CreateDispatchOrderUseCase,
    UpdateDispatchOrderUseCase,
    AddDispatchStopUseCase,
    RemoveDispatchStopUseCase,
    AddDispatchExpenseUseCase,
    RemoveDispatchExpenseUseCase,
    MarkDispatchOrderDispatchedUseCase,
    MarkDispatchOrderCompletedUseCase,
    CancelDispatchOrderUseCase,
    GetWarehousesListQueryUseCase,
    GetWarehouseQueryUseCase,
    CreateWarehouseUseCase,
    UpdateWarehouseUseCase,
    DeactivateWarehouseUseCase,
    GetWarehouseLocationsQueryUseCase,
    GetWarehouseLocationQueryUseCase,
    CreateWarehouseLocationUseCase,
    UpdateWarehouseLocationUseCase,
    GetWarehouseStockQueryUseCase,
    GetWarehouseStockCursorQueryUseCase,
    GetWarehouseStockByWarehouseQueryUseCase,
    GetWarehouseStockByWarehouseCursorQueryUseCase,
    GetProductsCursorQueryUseCase,
    GetInventoryLotsCursorQueryUseCase,
    GetInventoryMovementsCursorQueryUseCase,
    GetInventoryLotsListQueryUseCase,
    GetInventoryLotsPageQueryUseCase,
    GetInventoryLotQueryUseCase,
    CreateInventoryLotUseCase,
    UpdateInventoryLotUseCase,
    DeactivateInventoryLotUseCase,
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
    GetPromotionsListQueryUseCase,
    GetPromotionQueryUseCase,
    CreatePromotionUseCase,
    UpdatePromotionUseCase,
    DeletePromotionUseCase,
    GetPriceListBranchAssignmentsQueryUseCase,
    GetBranchPriceListsQueryUseCase,
    GetPriceListBranchAssignmentQueryUseCase,
    CreatePriceListBranchAssignmentUseCase,
    UpdatePriceListBranchAssignmentUseCase,
    DeletePriceListBranchAssignmentUseCase,
    GetPromotionBranchAssignmentsQueryUseCase,
    GetBranchPromotionsQueryUseCase,
    GetPromotionBranchAssignmentQueryUseCase,
    CreatePromotionBranchAssignmentUseCase,
    UpdatePromotionBranchAssignmentUseCase,
    DeletePromotionBranchAssignmentUseCase,
    GetInventoryMovementsListQueryUseCase,
    GetInventoryMovementsPageQueryUseCase,
    GetInventoryMovementQueryUseCase,
    AdjustInventoryUseCase,
    TransferInventoryUseCase,
    CancelInventoryMovementUseCase,
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
    InventoryLedgerService,
    InventoryReservationsService,
    InventoryValidationService,
  ],
})
export class InventoryModule {}
