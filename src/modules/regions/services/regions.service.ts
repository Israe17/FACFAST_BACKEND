import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canton } from '../entities/canton.entity';
import { Country } from '../entities/country.entity';
import { District } from '../entities/district.entity';
import { Province } from '../entities/province.entity';
import {
  CantonView,
  CountryView,
  DistrictView,
  ProvinceView,
} from '../contracts/region.views';

@Injectable()
export class RegionsService {
  constructor(
    @InjectRepository(Country)
    private readonly countries_repo: Repository<Country>,
    @InjectRepository(Province)
    private readonly provinces_repo: Repository<Province>,
    @InjectRepository(Canton)
    private readonly cantons_repo: Repository<Canton>,
    @InjectRepository(District)
    private readonly districts_repo: Repository<District>,
  ) {}

  async list_countries(): Promise<CountryView[]> {
    const rows = await this.countries_repo.find({ order: { name: 'ASC' } });
    return rows.map((c) => ({ id: c.id, code: c.code, name: c.name }));
  }

  async list_provinces(country_id: number): Promise<ProvinceView[]> {
    const rows = await this.provinces_repo.find({
      where: { country_id },
      order: { code: 'ASC' },
    });
    return rows.map((p) => ({
      id: p.id,
      country_id: p.country_id,
      code: p.code,
      name: p.name,
    }));
  }

  async list_cantons(province_id: number): Promise<CantonView[]> {
    const rows = await this.cantons_repo.find({
      where: { province_id },
      order: { code: 'ASC' },
    });
    return rows.map((c) => ({
      id: c.id,
      province_id: c.province_id,
      code: c.code,
      name: c.name,
    }));
  }

  async list_districts(canton_id: number): Promise<DistrictView[]> {
    const rows = await this.districts_repo.find({
      where: { canton_id },
      order: { code: 'ASC' },
    });
    return rows.map((d) => ({
      id: d.id,
      canton_id: d.canton_id,
      code: d.code,
      name: d.name,
    }));
  }
}
