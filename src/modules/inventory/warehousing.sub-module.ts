import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { DispatchCatalogValidationSubModule } from './dispatch-catalog-validation.sub-module';
import { WarehouseLocationsController } from './controllers/warehouse-locations.controller';
import { WarehouseStockController } from './controllers/warehouse-stock.controller';
import { WarehousesController } from './controllers/warehouses.controller';
import { ZonesController } from './controllers/zones.controller';
import { WarehouseBranchLink } from './entities/warehouse-branch-link.entity';
import { WarehouseLocation } from './entities/warehouse-location.entity';
import { WarehouseStock } from './entities/warehouse-stock.entity';
import { Warehouse } from './entities/warehouse.entity';
import { Zone } from './entities/zone.entity';
import { ZoneBranchLink } from './entities/zone-branch-link.entity';
import { InventoryValidationSubModule } from './inventory-validation.sub-module';
import { WarehouseAccessPolicy } from './policies/warehouse-access.policy';
import { WarehouseBranchLinksRepository } from './repositories/warehouse-branch-links.repository';
import { WarehouseLocationsRepository } from './repositories/warehouse-locations.repository';
import { WarehouseStockRepository } from './repositories/warehouse-stock.repository';
import { WarehousesRepository } from './repositories/warehouses.repository';
import { ZoneBranchLinksRepository } from './repositories/zone-branch-links.repository';
import { ZonesRepository } from './repositories/zones.repository';
import { WarehouseLocationSerializer } from './serializers/warehouse-location.serializer';
import { WarehouseSerializer } from './serializers/warehouse.serializer';
import { WarehouseStockSerializer } from './serializers/warehouse-stock.serializer';
import { WarehouseStockProjectionService } from './services/warehouse-stock-projection.service';
import { WarehouseStockService } from './services/warehouse-stock.service';
import { WarehousesService } from './services/warehouses.service';
import { ZonesService } from './services/zones.service';
import { ProductsSubModule } from './products.sub-module';
import { CreateWarehouseLocationUseCase } from './use-cases/create-warehouse-location.use-case';
import { CreateWarehouseUseCase } from './use-cases/create-warehouse.use-case';
import { DeactivateWarehouseUseCase } from './use-cases/deactivate-warehouse.use-case';
import { GetWarehouseLocationQueryUseCase } from './use-cases/get-warehouse-location.query.use-case';
import { GetWarehouseLocationsQueryUseCase } from './use-cases/get-warehouse-locations.query.use-case';
import { GetWarehouseQueryUseCase } from './use-cases/get-warehouse.query.use-case';
import { GetWarehouseStockByWarehouseCursorQueryUseCase } from './use-cases/get-warehouse-stock-by-warehouse-cursor.query.use-case';
import { GetWarehouseStockByWarehouseQueryUseCase } from './use-cases/get-warehouse-stock-by-warehouse.query.use-case';
import { GetWarehouseStockCursorQueryUseCase } from './use-cases/get-warehouse-stock-cursor.query.use-case';
import { GetWarehouseStockQueryUseCase } from './use-cases/get-warehouse-stock.query.use-case';
import { GetWarehousesListQueryUseCase } from './use-cases/get-warehouses-list.query.use-case';
import { UpdateWarehouseLocationUseCase } from './use-cases/update-warehouse-location.use-case';
import { UpdateWarehouseUseCase } from './use-cases/update-warehouse.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Warehouse,
      WarehouseBranchLink,
      WarehouseLocation,
      WarehouseStock,
      Zone,
      ZoneBranchLink,
    ]),
    BranchesModule,
    DispatchCatalogValidationSubModule,
    InventoryValidationSubModule,
    ProductsSubModule,
  ],
  controllers: [
    WarehousesController,
    WarehouseLocationsController,
    WarehouseStockController,
    ZonesController,
  ],
  providers: [
    WarehousesRepository,
    WarehouseBranchLinksRepository,
    WarehouseLocationsRepository,
    WarehouseStockRepository,
    ZoneBranchLinksRepository,
    ZonesRepository,
    WarehouseAccessPolicy,
    WarehouseSerializer,
    WarehouseLocationSerializer,
    WarehouseStockSerializer,
    WarehouseStockProjectionService,
    WarehousesService,
    WarehouseStockService,
    ZonesService,
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
  ],
  exports: [
    WarehousesService,
    WarehouseStockService,
    WarehouseStockProjectionService,
    WarehousesRepository,
    WarehouseBranchLinksRepository,
    WarehouseLocationsRepository,
    WarehouseStockRepository,
    ZoneBranchLinksRepository,
    ZonesRepository,
    ZonesService,
  ],
})
export class WarehousingSubModule {}
