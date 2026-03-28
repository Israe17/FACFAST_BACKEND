import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';
import { InventoryValidationSubModule } from './inventory-validation.sub-module';
import { Route } from './entities/route.entity';
import { RouteBranchLink } from './entities/route-branch-link.entity';
import { Vehicle } from './entities/vehicle.entity';
import { VehicleBranchLink } from './entities/vehicle-branch-link.entity';
import { Zone } from './entities/zone.entity';
import { ZoneBranchLink } from './entities/zone-branch-link.entity';
import { RouteBranchLinksRepository } from './repositories/route-branch-links.repository';
import { RoutesRepository } from './repositories/routes.repository';
import { VehicleBranchLinksRepository } from './repositories/vehicle-branch-links.repository';
import { VehiclesRepository } from './repositories/vehicles.repository';
import { ZoneBranchLinksRepository } from './repositories/zone-branch-links.repository';
import { ZonesRepository } from './repositories/zones.repository';
import { DispatchCatalogValidationService } from './services/dispatch-catalog-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Route,
      RouteBranchLink,
      Vehicle,
      VehicleBranchLink,
      Zone,
      ZoneBranchLink,
    ]),
    BranchesModule,
    UsersModule,
    InventoryValidationSubModule,
  ],
  providers: [
    RoutesRepository,
    RouteBranchLinksRepository,
    VehiclesRepository,
    VehicleBranchLinksRepository,
    ZonesRepository,
    ZoneBranchLinksRepository,
    DispatchCatalogValidationService,
  ],
  exports: [
    RoutesRepository,
    RouteBranchLinksRepository,
    VehiclesRepository,
    VehicleBranchLinksRepository,
    ZonesRepository,
    ZoneBranchLinksRepository,
    DispatchCatalogValidationService,
  ],
})
export class DispatchCatalogValidationSubModule {}
