import { Module } from '@nestjs/common';
import { CabysController } from './controllers/cabys.controller';
import { HaciendaController } from './controllers/hacienda.controller';
import { CabysService } from './services/cabys.service';
import { ExonerationService } from './services/exoneration.service';
import { TaxpayerService } from './services/taxpayer.service';

@Module({
  controllers: [CabysController, HaciendaController],
  providers: [CabysService, ExonerationService, TaxpayerService],
  exports: [CabysService, ExonerationService, TaxpayerService],
})
export class HaciendaModule {}
