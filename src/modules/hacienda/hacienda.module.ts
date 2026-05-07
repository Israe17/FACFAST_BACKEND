import { Module } from '@nestjs/common';
import { CabysController } from './controllers/cabys.controller';
import { HaciendaController } from './controllers/hacienda.controller';
import { CabysService } from './services/cabys.service';
import { ContactEmailService } from './services/contact-email.service';
import { ExonerationService } from './services/exoneration.service';
import { TaxpayerService } from './services/taxpayer.service';

@Module({
  controllers: [CabysController, HaciendaController],
  providers: [
    CabysService,
    ContactEmailService,
    ExonerationService,
    TaxpayerService,
  ],
  exports: [
    CabysService,
    ContactEmailService,
    ExonerationService,
    TaxpayerService,
  ],
})
export class HaciendaModule {}
