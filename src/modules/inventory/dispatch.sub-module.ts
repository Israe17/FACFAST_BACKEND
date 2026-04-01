import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BranchesModule } from '../branches/branches.module';
import { ContactsModule } from '../contacts/contacts.module';
import { SaleOrder } from '../sales/entities/sale-order.entity';
import { DispatchCatalogValidationSubModule } from './dispatch-catalog-validation.sub-module';
import { DispatchOrdersController } from './controllers/dispatch-orders.controller';
import { RoutesController } from './controllers/routes.controller';
import { VehiclesController } from './controllers/vehicles.controller';
import { DispatchExpense } from './entities/dispatch-expense.entity';
import { DispatchOrder } from './entities/dispatch-order.entity';
import { DispatchStop } from './entities/dispatch-stop.entity';
import { DispatchOrderAccessPolicy } from './policies/dispatch-order-access.policy';
import { DispatchOrderLifecyclePolicy } from './policies/dispatch-order-lifecycle.policy';
import { DispatchSaleOrderPolicy } from './policies/dispatch-sale-order.policy';
import { DispatchOrdersRepository } from './repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from './serializers/dispatch-order.serializer';
import { DispatchOrdersService } from './services/dispatch-orders.service';
import { RoutesService } from './services/routes.service';
import { VehiclesService } from './services/vehicles.service';
import { WarehousingSubModule } from './warehousing.sub-module';
import { MovementsSubModule } from './movements.sub-module';
import { AddDispatchExpenseUseCase } from './use-cases/add-dispatch-expense.use-case';
import { AddDispatchStopUseCase } from './use-cases/add-dispatch-stop.use-case';
import { CancelDispatchOrderUseCase } from './use-cases/cancel-dispatch-order.use-case';
import { DeleteDispatchOrderUseCase } from './use-cases/delete-dispatch-order.use-case';
import { CreateDispatchOrderUseCase } from './use-cases/create-dispatch-order.use-case';
import { GetDispatchOrderQueryUseCase } from './use-cases/get-dispatch-order.query.use-case';
import { GetDispatchOrdersCursorQueryUseCase } from './use-cases/get-dispatch-orders-cursor.query.use-case';
import { GetDispatchOrdersListQueryUseCase } from './use-cases/get-dispatch-orders-list.query.use-case';
import { MarkDispatchOrderReadyUseCase } from './use-cases/mark-dispatch-order-ready.use-case';
import { MarkDispatchOrderCompletedUseCase } from './use-cases/mark-dispatch-order-completed.use-case';
import { MarkDispatchOrderDispatchedUseCase } from './use-cases/mark-dispatch-order-dispatched.use-case';
import { RemoveDispatchExpenseUseCase } from './use-cases/remove-dispatch-expense.use-case';
import { RemoveDispatchStopUseCase } from './use-cases/remove-dispatch-stop.use-case';
import { UpdateDispatchOrderUseCase } from './use-cases/update-dispatch-order.use-case';
import { UpdateDispatchStopStatusUseCase } from './use-cases/update-dispatch-stop-status.use-case';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DispatchOrder,
      DispatchStop,
      DispatchExpense,
      SaleOrder,
    ]),
    BranchesModule,
    ContactsModule,
    DispatchCatalogValidationSubModule,
    WarehousingSubModule,
    MovementsSubModule,
  ],
  controllers: [
    DispatchOrdersController,
    RoutesController,
    VehiclesController,
  ],
  providers: [
    DispatchOrdersRepository,
    DispatchOrderAccessPolicy,
    DispatchOrderLifecyclePolicy,
    DispatchSaleOrderPolicy,
    DispatchOrderSerializer,
    DispatchOrdersService,
    RoutesService,
    VehiclesService,
    GetDispatchOrdersListQueryUseCase,
    GetDispatchOrdersCursorQueryUseCase,
    GetDispatchOrderQueryUseCase,
    CreateDispatchOrderUseCase,
    UpdateDispatchOrderUseCase,
    UpdateDispatchStopStatusUseCase,
    MarkDispatchOrderReadyUseCase,
    AddDispatchStopUseCase,
    RemoveDispatchStopUseCase,
    AddDispatchExpenseUseCase,
    RemoveDispatchExpenseUseCase,
    MarkDispatchOrderDispatchedUseCase,
    MarkDispatchOrderCompletedUseCase,
    CancelDispatchOrderUseCase,
    DeleteDispatchOrderUseCase,
  ],
  exports: [
    DispatchOrdersService,
    DispatchOrdersRepository,
  ],
})
export class DispatchSubModule {}
