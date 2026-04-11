import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContactsModule } from '../contacts/contacts.module';
import { DispatchStop } from '../inventory/entities/dispatch-stop.entity';
import { SaleOrder } from './entities/sale-order.entity';
import { SaleOrderLine } from './entities/sale-order-line.entity';
import { SaleOrderDeliveryCharge } from './entities/sale-order-delivery-charge.entity';
import { ElectronicDocument } from './entities/electronic-document.entity';
import { SaleOrdersRepository } from './repositories/sale-orders.repository';
import { ElectronicDocumentsRepository } from './repositories/electronic-documents.repository';
import { SaleOrdersService } from './services/sale-orders.service';
import { ElectronicDocumentsService } from './services/electronic-documents.service';
import { ElectronicDocumentOutboxWorkerService } from './services/electronic-document-outbox-worker.service';
import { SaleOrdersController } from './controllers/sale-orders.controller';
import { ElectronicDocumentsController } from './controllers/electronic-documents.controller';
import { InventoryModule } from '../inventory/inventory.module';
import { InventoryValidationSubModule } from '../inventory/inventory-validation.sub-module';
import { BranchesModule } from '../branches/branches.module';
import { UsersModule } from '../users/users.module';
import { ElectronicDocumentAccessPolicy } from './policies/electronic-document-access.policy';
import { ElectronicDocumentLifecyclePolicy } from './policies/electronic-document-lifecycle.policy';
import { SaleOrderAccessPolicy } from './policies/sale-order-access.policy';
import { SaleOrderLifecyclePolicy } from './policies/sale-order-lifecycle.policy';
import { SaleOrderInventoryPolicy } from './policies/sale-order-inventory.policy';
import { SaleOrderModePolicy } from './policies/sale-order-mode.policy';
import { ElectronicDocumentSerializer } from './serializers/electronic-document.serializer';
import { SaleOrderSerializer } from './serializers/sale-order.serializer';
import { CreateSaleOrderUseCase } from './use-cases/create-sale-order.use-case';
import { ConfirmSaleOrderUseCase } from './use-cases/confirm-sale-order.use-case';
import { CancelSaleOrderUseCase } from './use-cases/cancel-sale-order.use-case';
import { DeleteSaleOrderUseCase } from './use-cases/delete-sale-order.use-case';
import { ResetSaleOrderDispatchStatusUseCase } from './use-cases/reset-sale-order-dispatch-status.use-case';
import { EmitElectronicDocumentUseCase } from './use-cases/emit-electronic-document.use-case';
import { GetElectronicDocumentQueryUseCase } from './use-cases/get-electronic-document.query.use-case';
import { GetElectronicDocumentsCursorQueryUseCase } from './use-cases/get-electronic-documents-cursor.query.use-case';
import { GetElectronicDocumentsListQueryUseCase } from './use-cases/get-electronic-documents-list.query.use-case';
import { GetElectronicDocumentsPageQueryUseCase } from './use-cases/get-electronic-documents-page.query.use-case';
import { ProcessElectronicDocumentEmissionOutboxUseCase } from './use-cases/process-electronic-document-emission-outbox.use-case';
import { GetSaleOrderQueryUseCase } from './use-cases/get-sale-order.query.use-case';
import { GetSaleOrdersCursorQueryUseCase } from './use-cases/get-sale-orders-cursor.query.use-case';
import { GetSaleOrdersListQueryUseCase } from './use-cases/get-sale-orders-list.query.use-case';
import { GetSaleOrdersPageQueryUseCase } from './use-cases/get-sale-orders-page.query.use-case';
import { UpdateSaleOrderUseCase } from './use-cases/update-sale-order.use-case';
import { SalesValidationService } from './services/sales-validation.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrder,
      SaleOrderLine,
      SaleOrderDeliveryCharge,
      ElectronicDocument,
      DispatchStop,
    ]),
    InventoryModule,
    InventoryValidationSubModule,
    BranchesModule,
    ContactsModule,
    UsersModule,
  ],
  controllers: [SaleOrdersController, ElectronicDocumentsController],
  providers: [
    SaleOrdersRepository,
    ElectronicDocumentsRepository,
    ElectronicDocumentAccessPolicy,
    ElectronicDocumentLifecyclePolicy,
    SaleOrderAccessPolicy,
    SaleOrderLifecyclePolicy,
    SaleOrderInventoryPolicy,
    SaleOrderModePolicy,
    SalesValidationService,
    ElectronicDocumentSerializer,
    SaleOrderSerializer,
    CreateSaleOrderUseCase,
    UpdateSaleOrderUseCase,
    ConfirmSaleOrderUseCase,
    CancelSaleOrderUseCase,
    DeleteSaleOrderUseCase,
    ResetSaleOrderDispatchStatusUseCase,
    GetSaleOrderQueryUseCase,
    GetSaleOrdersListQueryUseCase,
    GetSaleOrdersPageQueryUseCase,
    GetSaleOrdersCursorQueryUseCase,
    GetElectronicDocumentsListQueryUseCase,
    GetElectronicDocumentsPageQueryUseCase,
    GetElectronicDocumentsCursorQueryUseCase,
    GetElectronicDocumentQueryUseCase,
    EmitElectronicDocumentUseCase,
    ProcessElectronicDocumentEmissionOutboxUseCase,
    SaleOrdersService,
    ElectronicDocumentsService,
    ElectronicDocumentOutboxWorkerService,
  ],
  exports: [
    SaleOrdersRepository,
    ElectronicDocumentsRepository,
    ElectronicDocumentAccessPolicy,
    ElectronicDocumentLifecyclePolicy,
    SaleOrderAccessPolicy,
    SaleOrderLifecyclePolicy,
    SaleOrdersService,
    ElectronicDocumentsService,
  ],
})
export class SalesModule {}
