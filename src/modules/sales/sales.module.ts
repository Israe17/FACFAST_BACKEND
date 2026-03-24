import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrder } from './entities/sale-order.entity';
import { SaleOrderLine } from './entities/sale-order-line.entity';
import { SaleOrderDeliveryCharge } from './entities/sale-order-delivery-charge.entity';
import { ElectronicDocument } from './entities/electronic-document.entity';
import { SaleOrdersRepository } from './repositories/sale-orders.repository';
import { ElectronicDocumentsRepository } from './repositories/electronic-documents.repository';
import { SaleOrdersService } from './services/sale-orders.service';
import { ElectronicDocumentsService } from './services/electronic-documents.service';
import { SaleOrdersController } from './controllers/sale-orders.controller';
import { ElectronicDocumentsController } from './controllers/electronic-documents.controller';
import { InventoryModule } from '../inventory/inventory.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrder,
      SaleOrderLine,
      SaleOrderDeliveryCharge,
      ElectronicDocument,
    ]),
    InventoryModule,
  ],
  controllers: [SaleOrdersController, ElectronicDocumentsController],
  providers: [
    SaleOrdersRepository,
    ElectronicDocumentsRepository,
    SaleOrdersService,
    ElectronicDocumentsService,
  ],
  exports: [
    SaleOrdersRepository,
    ElectronicDocumentsRepository,
    SaleOrdersService,
    ElectronicDocumentsService,
  ],
})
export class SalesModule {}
