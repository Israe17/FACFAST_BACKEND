import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxInclusionMode } from '../enums/tax-inclusion-mode.enum';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';
import { EnsureTaxProfileForCabysUseCase } from './ensure-tax-profile-for-cabys.use-case';

describe('EnsureTaxProfileForCabysUseCase', () => {
  let use_case: EnsureTaxProfileForCabysUseCase;
  let tax_profiles_repository: jest.Mocked<TaxProfilesRepository>;

  beforeEach(() => {
    tax_profiles_repository = {
      find_active_by_cabys_in_business: jest.fn(),
      exists_name_in_business: jest.fn(),
      create: jest.fn((payload) => payload as TaxProfile),
      save: jest.fn(),
    } as unknown as jest.Mocked<TaxProfilesRepository>;

    use_case = new EnsureTaxProfileForCabysUseCase(tax_profiles_repository);
  });

  it('returns existing profile when one is already registered for the cabys', async () => {
    const existing = { id: 99, cabys_code: '6210.0' } as TaxProfile;
    tax_profiles_repository.find_active_by_cabys_in_business.mockResolvedValue(
      existing,
    );

    const result = await use_case.execute({
      business_id: 1,
      cabys_code: '6210.0',
      cabys_descripcion: null,
      cabys_impuesto: 13,
    });

    expect(result).toBe(existing);
    expect(tax_profiles_repository.save).not.toHaveBeenCalled();
  });

  it('creates a new IVA profile with rate 13 when no existing profile matches', async () => {
    tax_profiles_repository.find_active_by_cabys_in_business.mockResolvedValue(
      null,
    );
    tax_profiles_repository.exists_name_in_business.mockResolvedValue(false);
    tax_profiles_repository.save.mockImplementation(async (entity) => ({
      ...(entity as TaxProfile),
      id: 1,
    }));

    const result = await use_case.execute({
      business_id: 1,
      cabys_code: '6210.0',
      cabys_descripcion: 'Servicios de software',
      cabys_impuesto: 13,
      item_kind: TaxProfileItemKind.SERVICE,
    });

    expect(result).not.toBeNull();
    expect(result!.tax_type).toBe(TaxType.IVA);
    expect(result!.iva_rate).toBe(13);
    expect(result!.iva_rate_code).toBe('08');
    expect(result!.item_kind).toBe(TaxProfileItemKind.SERVICE);
    expect(result!.tax_inclusion_mode).toBe(TaxInclusionMode.ADDED);
  });

  it('creates an EXENTO profile when rate is zero', async () => {
    tax_profiles_repository.find_active_by_cabys_in_business.mockResolvedValue(
      null,
    );
    tax_profiles_repository.exists_name_in_business.mockResolvedValue(false);
    tax_profiles_repository.save.mockImplementation(async (entity) => ({
      ...(entity as TaxProfile),
      id: 2,
    }));

    const result = await use_case.execute({
      business_id: 1,
      cabys_code: '0001.0',
      cabys_descripcion: 'Producto exento',
      cabys_impuesto: 0,
    });

    expect(result!.tax_type).toBe(TaxType.EXENTO);
    expect(result!.iva_rate).toBeNull();
    expect(result!.iva_rate_code).toBeNull();
  });

  it('falls back to existing match when save fails (concurrent insert)', async () => {
    const concurrent_profile = { id: 77, cabys_code: '6210.0' } as TaxProfile;
    tax_profiles_repository.find_active_by_cabys_in_business
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(concurrent_profile);
    tax_profiles_repository.exists_name_in_business.mockResolvedValue(false);
    tax_profiles_repository.save.mockRejectedValue(
      new Error('duplicate key value'),
    );

    const result = await use_case.execute({
      business_id: 1,
      cabys_code: '6210.0',
      cabys_descripcion: null,
      cabys_impuesto: 13,
    });

    expect(result).toBe(concurrent_profile);
  });

  it('appends cabys code to name when generated name collides', async () => {
    tax_profiles_repository.find_active_by_cabys_in_business.mockResolvedValue(
      null,
    );
    tax_profiles_repository.exists_name_in_business.mockResolvedValue(true);
    tax_profiles_repository.save.mockImplementation(async (entity) => ({
      ...(entity as TaxProfile),
      id: 3,
    }));

    const result = await use_case.execute({
      business_id: 1,
      cabys_code: '6210.0',
      cabys_descripcion: 'Otra cosa',
      cabys_impuesto: 13,
    });

    expect(result!.name).toContain('[6210.0]');
  });
});
