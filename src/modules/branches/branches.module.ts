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
import { BranchConfigurationPolicy } from './policies/branch-configuration.policy';
import { BranchLifecyclePolicy } from './policies/branch-lifecycle.policy';
import { BranchesRepository } from './repositories/branches.repository';
import { TerminalsRepository } from './repositories/terminals.repository';
import { BranchSerializer } from './serializers/branch.serializer';
import { BranchesService } from './services/branches.service';
import { BranchesValidationService } from './services/branches-validation.service';
import { TerminalsService } from './services/terminals.service';
import { TerminalSerializer } from './serializers/terminal.serializer';
import { CreateBranchUseCase } from './use-cases/create-branch.use-case';
import { CreateTerminalUseCase } from './use-cases/create-terminal.use-case';
import { DeleteBranchUseCase } from './use-cases/delete-branch.use-case';
import { DeleteTerminalUseCase } from './use-cases/delete-terminal.use-case';
import { GetBranchQueryUseCase } from './use-cases/get-branch.query.use-case';
import { GetBranchesListQueryUseCase } from './use-cases/get-branches-list.query.use-case';
import { GetTerminalQueryUseCase } from './use-cases/get-terminal.query.use-case';
import { UpdateBranchUseCase } from './use-cases/update-branch.use-case';
import { UpdateTerminalUseCase } from './use-cases/update-terminal.use-case';

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
    BranchConfigurationPolicy,
    BranchLifecyclePolicy,
    BranchSerializer,
    TerminalSerializer,
    BranchesValidationService,
    GetBranchesListQueryUseCase,
    GetBranchQueryUseCase,
    CreateBranchUseCase,
    UpdateBranchUseCase,
    DeleteBranchUseCase,
    CreateTerminalUseCase,
    GetTerminalQueryUseCase,
    UpdateTerminalUseCase,
    DeleteTerminalUseCase,
    BranchesService,
    TerminalsService,
  ],
  exports: [BranchAccessPolicy, BranchesRepository, BranchesService],
})
export class BranchesModule {}
