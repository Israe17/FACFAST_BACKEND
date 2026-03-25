import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { InventoryLotsController } from './controllers/inventory-lots.controller';
import { InventoryMovementsController } from './controllers/inventory-movements.controller';
import { InventoryBalance } from './entities/inventory-balance.entity';
import { InventoryLot } from './entities/inventory-lot.entity';
import { InventoryMovementHeader } from './entities/inventory-movement-header.entity';
import { InventoryMovementLine } from './entities/inventory-movement-line.entity';
import { InventoryMovement } from './entities/inventory-movement.entity';
import { InventoryReservation } from './entities/inventory-reservation.entity';
import { InventoryLotAccessPolicy } from './policies/inventory-lot-access.policy';
import { InventoryMovementAccessPolicy } from './policies/inventory-movement-access.policy';
import { InventoryMovementLifecyclePolicy } from './policies/inventory-movement-lifecycle.policy';
import { InventoryBalancesRepository } from './repositories/inventory-balances.repository';
import { InventoryLotsRepository } from './repositories/inventory-lots.repository';
import { InventoryMovementHeadersRepository } from './repositories/inventory-movement-headers.repository';
import { InventoryMovementLinesRepository } from './repositories/inventory-movement-lines.repository';
import { InventoryMovementsRepository } from './repositories/inventory-movements.repository';
import { InventoryReservationsRepository } from './repositories/inventory-reservations.repository';
import { InventoryLotSerializer } from './serializers/inventory-lot.serializer';
import { InventoryMovementSerializer } from './serializers/inventory-movement.serializer';
import { InventoryValidationSubModule } from './inventory-validation.sub-module';
import { InventoryAdjustmentsService } from './services/inventory-adjustments.service';
import { InventoryLedgerService } from './services/inventory-ledger.service';
import { InventoryLotsService } from './services/inventory-lots.service';
import { InventoryMovementsService } from './services/inventory-movements.service';
import { InventoryReservationsService } from './services/inventory-reservations.service';
import { InventoryTransfersService } from './services/inventory-transfers.service';
import { ProductsSubModule } from './products.sub-module';
import { WarehousingSubModule } from './warehousing.sub-module';
import { AdjustInventoryUseCase } from './use-cases/adjust-inventory.use-case';
import { CancelInventoryMovementUseCase } from './use-cases/cancel-inventory-movement.use-case';
import { CreateInventoryLotUseCase } from './use-cases/create-inventory-lot.use-case';
import { DeactivateInventoryLotUseCase } from './use-cases/deactivate-inventory-lot.use-case';
import { GetInventoryLotQueryUseCase } from './use-cases/get-inventory-lot.query.use-case';
import { GetInventoryLotsCursorQueryUseCase } from './use-cases/get-inventory-lots-cursor.query.use-case';
import { GetInventoryLotsListQueryUseCase } from './use-cases/get-inventory-lots-list.query.use-case';
import { GetInventoryLotsPageQueryUseCase } from './use-cases/get-inventory-lots-page.query.use-case';
import { GetInventoryMovementQueryUseCase } from './use-cases/get-inventory-movement.query.use-case';
import { GetInventoryMovementsCursorQueryUseCase } from './use-cases/get-inventory-movements-cursor.query.use-case';
import { GetInventoryMovementsListQueryUseCase } from './use-cases/get-inventory-movements-list.query.use-case';
import { GetInventoryMovementsPageQueryUseCase } from './use-cases/get-inventory-movements-page.query.use-case';
import { TransferInventoryUseCase } from './use-cases/transfer-inventory.use-case';
import { UpdateInventoryLotUseCase } from './use-cases/update-inventory-lot.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      InventoryBalance,
      InventoryLot,
      InventoryMovement,
      InventoryMovementHeader,
      InventoryMovementLine,
      InventoryReservation,
    ]),
    BranchesModule,
    InventoryValidationSubModule,
    ProductsSubModule,
    WarehousingSubModule,
  ],
  controllers: [
    InventoryLotsController,
    InventoryMovementsController,
  ],
  providers: [
    InventoryBalancesRepository,
    InventoryLotsRepository,
    InventoryMovementsRepository,
    InventoryMovementHeadersRepository,
    InventoryMovementLinesRepository,
    InventoryReservationsRepository,
    InventoryLotAccessPolicy,
    InventoryMovementAccessPolicy,
    InventoryMovementLifecyclePolicy,
    InventoryLotSerializer,
    InventoryMovementSerializer,
    InventoryLedgerService,
    InventoryReservationsService,
    InventoryAdjustmentsService,
    InventoryLotsService,
    InventoryMovementsService,
    InventoryTransfersService,
    GetInventoryLotsCursorQueryUseCase,
    GetInventoryLotsListQueryUseCase,
    GetInventoryLotsPageQueryUseCase,
    GetInventoryLotQueryUseCase,
    CreateInventoryLotUseCase,
    UpdateInventoryLotUseCase,
    DeactivateInventoryLotUseCase,
    GetInventoryMovementsCursorQueryUseCase,
    GetInventoryMovementsListQueryUseCase,
    GetInventoryMovementsPageQueryUseCase,
    GetInventoryMovementQueryUseCase,
    AdjustInventoryUseCase,
    TransferInventoryUseCase,
    CancelInventoryMovementUseCase,
  ],
  exports: [
    InventoryLotsService,
    InventoryMovementsService,
    InventoryLedgerService,
    InventoryReservationsService,
    InventoryAdjustmentsService,
    InventoryTransfersService,
    InventoryBalancesRepository,
    InventoryLotsRepository,
    InventoryMovementsRepository,
    InventoryMovementHeadersRepository,
    InventoryMovementLinesRepository,
    InventoryReservationsRepository,
  ],
})
export class MovementsSubModule {}
