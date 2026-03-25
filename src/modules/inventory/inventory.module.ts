import { Module } from '@nestjs/common';
import { DispatchCatalogValidationSubModule } from './dispatch-catalog-validation.sub-module';
import { DispatchSubModule } from './dispatch.sub-module';
import { MovementsSubModule } from './movements.sub-module';
import { PricingSubModule } from './pricing.sub-module';
import { ProductsSubModule } from './products.sub-module';
import { PromotionsSubModule } from './promotions.sub-module';
import { WarehousingSubModule } from './warehousing.sub-module';

@Module({
  imports: [
    DispatchCatalogValidationSubModule,
    ProductsSubModule,
    PricingSubModule,
    PromotionsSubModule,
    WarehousingSubModule,
    MovementsSubModule,
    DispatchSubModule,
  ],
  exports: [
    DispatchCatalogValidationSubModule,
    ProductsSubModule,
    PricingSubModule,
    PromotionsSubModule,
    WarehousingSubModule,
    MovementsSubModule,
    DispatchSubModule,
  ],
})
export class InventoryModule {}
