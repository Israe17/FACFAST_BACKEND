import { readFileSync } from 'fs';
import { join } from 'path';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Canton } from '../entities/canton.entity';
import { Country } from '../entities/country.entity';
import { District } from '../entities/district.entity';
import { Province } from '../entities/province.entity';

type SeedDistrict = { code: string; name: string };
type SeedCanton = { code: string; name: string; districts: SeedDistrict[] };
type SeedProvince = { code: string; name: string; cantons: SeedCanton[] };
type SeedDocument = {
  country: { code: string; name: string };
  provinces: SeedProvince[];
};

@Injectable()
export class RegionsSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RegionsSeedService.name);

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

  async onApplicationBootstrap(): Promise<void> {
    try {
      const existing = await this.countries_repo.count();
      if (existing > 0) {
        return;
      }
      const document = this.load_seed_document('costa-rica.json');
      await this.seed_document(document);
      this.logger.log('regions seed completed (Costa Rica)');
    } catch (error) {
      this.logger.error(
        `regions seed failed; continuing without it: ${(error as Error).message}`,
      );
    }
  }

  private load_seed_document(file_name: string): SeedDocument {
    const candidate_paths = [
      join(__dirname, '..', 'seed', file_name),
      join(process.cwd(), 'src', 'modules', 'regions', 'seed', file_name),
    ];
    for (const path of candidate_paths) {
      try {
        const raw = readFileSync(path, 'utf-8');
        return JSON.parse(raw) as SeedDocument;
      } catch {
        // try next candidate
      }
    }
    throw new Error(`Could not find seed file ${file_name}`);
  }

  private async seed_document(doc: SeedDocument): Promise<void> {
    const country = await this.countries_repo.save(
      this.countries_repo.create({
        code: doc.country.code,
        name: doc.country.name,
      }),
    );

    for (const province_seed of doc.provinces) {
      const province = await this.provinces_repo.save(
        this.provinces_repo.create({
          country_id: country.id,
          code: province_seed.code,
          name: province_seed.name,
        }),
      );

      for (const canton_seed of province_seed.cantons) {
        const canton = await this.cantons_repo.save(
          this.cantons_repo.create({
            province_id: province.id,
            code: canton_seed.code,
            name: canton_seed.name,
          }),
        );

        const districts = canton_seed.districts.map((district_seed) =>
          this.districts_repo.create({
            canton_id: canton.id,
            code: district_seed.code,
            name: district_seed.name,
          }),
        );
        if (districts.length) {
          await this.districts_repo.save(districts);
        }
      }
    }
  }
}
