import { Module } from '@nestjs/common';
import { CabysController } from './controllers/cabys.controller';
import { CabysService } from './services/cabys.service';

@Module({
  controllers: [CabysController],
  providers: [CabysService],
  exports: [CabysService],
})
export class HaciendaModule {}
