import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesController } from './controllers/branches.controller';
import { TerminalsController } from './controllers/terminals.controller';
import { InventoryLot } from '../inventory/entities/inventory-lot.entity';
import { InventoryMovementHeader } from '../inventory/entities/inventory-movement-header.entity';
import { InventoryMovement } from '../inventory/entities/inventory-movement.entity';
import { WarehouseBranchLink } from '../inventory/entities/warehouse-branch-link.entity';
import { WarehouseLocation } from '../inventory/entities/warehouse-location.entity';
import { WarehouseStock } from '../inventory/entities/warehouse-stock.entity';
import { Warehouse } from '../inventory/entities/warehouse.entity';
import { Branch } from './entities/branch.entity';
import { Terminal } from './entities/terminal.entity';
import { BranchAccessPolicy } from './policies/branch-access.policy';
import { BranchesRepository } from './repositories/branches.repository';
import { TerminalsRepository } from './repositories/terminals.repository';
import { BranchesService } from './services/branches.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Branch,
      Terminal,
      Warehouse,
      WarehouseLocation,
      WarehouseStock,
      WarehouseBranchLink,
      InventoryLot,
      InventoryMovement,
      InventoryMovementHeader,
    ]),
  ],
  controllers: [BranchesController, TerminalsController],
  providers: [
    BranchesRepository,
    TerminalsRepository,
    BranchAccessPolicy,
    BranchesService,
  ],
  exports: [BranchAccessPolicy, BranchesRepository, BranchesService],
})
export class BranchesModule {}
