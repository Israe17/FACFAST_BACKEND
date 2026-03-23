import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SaleOrder } from './entities/sale-order.entity';
import { SaleOrderLine } from './entities/sale-order-line.entity';
import { SaleOrderDeliveryCharge } from './entities/sale-order-delivery-charge.entity';
import { SaleOrdersRepository } from './repositories/sale-orders.repository';
import { SaleOrdersService } from './services/sale-orders.service';
import { SaleOrdersController } from './controllers/sale-orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SaleOrder,
      SaleOrderLine,
      SaleOrderDeliveryCharge,
    ]),
  ],
  controllers: [SaleOrdersController],
  providers: [SaleOrdersRepository, SaleOrdersService],
  exports: [SaleOrdersService],
})
export class SalesModule {}
