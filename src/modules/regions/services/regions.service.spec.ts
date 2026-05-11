import type { Repository } from 'typeorm';
import { Canton } from '../entities/canton.entity';
import { Country } from '../entities/country.entity';
import { District } from '../entities/district.entity';
import { Province } from '../entities/province.entity';
import { RegionsService } from './regions.service';

describe('RegionsService', () => {
  const countries_repo = {
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<Country>>;
  const provinces_repo = {
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<Province>>;
  const cantons_repo = {
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<Canton>>;
  const districts_repo = {
    find: jest.fn(),
  } as unknown as jest.Mocked<Repository<District>>;

  let service: RegionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new RegionsService(
      countries_repo,
      provinces_repo,
      cantons_repo,
      districts_repo,
    );
  });

  it('lists countries sorted by name', async () => {
    (countries_repo.find as jest.Mock).mockResolvedValue([
      { id: 1, code: 'CR', name: 'Costa Rica' },
    ]);

    await expect(service.list_countries()).resolves.toEqual([
      { id: 1, code: 'CR', name: 'Costa Rica' },
    ]);
    expect(countries_repo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
  });

  it('filters provinces by country_id', async () => {
    (provinces_repo.find as jest.Mock).mockResolvedValue([
      { id: 10, country_id: 1, code: '1', name: 'San José' },
    ]);

    await expect(service.list_provinces(1)).resolves.toEqual([
      { id: 10, country_id: 1, code: '1', name: 'San José' },
    ]);
    expect(provinces_repo.find).toHaveBeenCalledWith({
      where: { country_id: 1 },
      order: { code: 'ASC' },
    });
  });

  it('filters cantons by province_id', async () => {
    (cantons_repo.find as jest.Mock).mockResolvedValue([
      { id: 100, province_id: 10, code: '02', name: 'Escazú' },
    ]);

    await expect(service.list_cantons(10)).resolves.toEqual([
      { id: 100, province_id: 10, code: '02', name: 'Escazú' },
    ]);
    expect(cantons_repo.find).toHaveBeenCalledWith({
      where: { province_id: 10 },
      order: { code: 'ASC' },
    });
  });

  it('filters districts by canton_id', async () => {
    (districts_repo.find as jest.Mock).mockResolvedValue([
      { id: 1000, canton_id: 100, code: '03', name: 'San Rafael' },
    ]);

    await expect(service.list_districts(100)).resolves.toEqual([
      { id: 1000, canton_id: 100, code: '03', name: 'San Rafael' },
    ]);
    expect(districts_repo.find).toHaveBeenCalledWith({
      where: { canton_id: 100 },
      order: { code: 'ASC' },
    });
  });
});
