import { Module } from '@nestjs/common';
import { DispatchSubModule } from './dispatch.sub-module';
import { MovementsSubModule } from './movements.sub-module';
import { PricingSubModule } from './pricing.sub-module';
import { ProductsSubModule } from './products.sub-module';
import { PromotionsSubModule } from './promotions.sub-module';
import { WarehousingSubModule } from './warehousing.sub-module';

@Module({
  imports: [
    ProductsSubModule,
    PricingSubModule,
    PromotionsSubModule,
    WarehousingSubModule,
    MovementsSubModule,
    DispatchSubModule,
  ],
  exports: [
    ProductsSubModule,
    PricingSubModule,
    PromotionsSubModule,
    WarehousingSubModule,
    MovementsSubModule,
    DispatchSubModule,
  ],
})
export class InventoryModule {}
