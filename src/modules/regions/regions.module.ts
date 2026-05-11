import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RegionsController } from './controllers/regions.controller';
import { Canton } from './entities/canton.entity';
import { Country } from './entities/country.entity';
import { District } from './entities/district.entity';
import { Province } from './entities/province.entity';
import { RegionsSeedService } from './services/regions-seed.service';
import { RegionsService } from './services/regions.service';

@Module({
  imports: [TypeOrmModule.forFeature([Country, Province, Canton, District])],
  controllers: [RegionsController],
  providers: [RegionsService, RegionsSeedService],
  exports: [RegionsService],
})
export class RegionsModule {}
