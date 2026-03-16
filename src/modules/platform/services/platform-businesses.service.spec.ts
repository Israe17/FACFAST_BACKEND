import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { PlatformBusinessesService } from './platform-businesses.service';

describe('PlatformBusinessesService', () => {
  const businesses_repository = {
    find_all: jest.fn(),
    find_by_id: jest.fn(),
  };

  const branches_repository = {
    find_all_by_business: jest.fn(),
  };

  const business_onboarding_service = {
    onboard_business: jest.fn(),
  };

  let service: PlatformBusinessesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlatformBusinessesService(
      businesses_repository as never,
      branches_repository as never,
      business_onboarding_service as never,
    );
  });

  it('lists all businesses for the platform panel', async () => {
    businesses_repository.find_all.mockResolvedValue([
      {
        id: 1,
        code: 'BS-0001',
        name: 'Multillantas',
        legal_name: 'Multillantas Sociedad Anonima',
        identification_type: '02',
        identification_number: '3101123456',
        currency_code: 'CRC',
        timezone: 'America/Costa_Rica',
        language: 'es-CR',
        email: null,
        phone: null,
        website: null,
        logo_url: null,
        country: 'Costa Rica',
        province: 'Guanacaste',
        canton: 'Liberia',
        district: 'Liberia',
        city: null,
        address: 'Centro',
        postal_code: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ]);

    await expect(service.get_businesses()).resolves.toMatchObject([
      {
        id: 1,
        code: 'BS-0001',
        name: 'Multillantas',
      },
    ]);
  });

  it('returns branches for the selected business', async () => {
    businesses_repository.find_by_id.mockResolvedValue({
      id: 7,
      code: 'BS-0007',
    });
    branches_repository.find_all_by_business.mockResolvedValue([
      {
        id: 10,
        code: 'BR-0010',
        business_id: 7,
        business_name: 'Multillantas Liberia',
        name: 'Liberia',
        legal_name: 'Multillantas Sociedad Anonima',
        identification_type: '02',
        identification_number: '3101123456',
        cedula_juridica: '3101123456',
        branch_number: '001',
        address: 'Centro',
        province: 'Guanacaste',
        canton: 'Liberia',
        district: 'Liberia',
        city: 'Liberia',
        phone: null,
        email: null,
        activity_code: null,
        provider_code: null,
        cert_path: null,
        crypto_key_encrypted: null,
        hacienda_username: null,
        hacienda_password_encrypted: null,
        mail_key_encrypted: null,
        signature_type: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        terminals: [],
      },
    ]);

    await expect(service.get_business_branches(7)).resolves.toMatchObject([
      {
        id: 10,
        business_id: 7,
        branch_number: '001',
      },
    ]);
  });

  it('fails when the selected business does not exist', async () => {
    businesses_repository.find_by_id.mockResolvedValue(null);

    await expect(service.get_business(999)).rejects.toBeInstanceOf(
      DomainNotFoundException,
    );
  });

  it('delegates onboarding to the existing business onboarding flow', async () => {
    business_onboarding_service.onboard_business.mockResolvedValue({
      onboarding_ready: true,
    });

    await expect(
      service.onboard_business({
        business: {
          name: 'Multillantas',
          legal_name: 'Multillantas Sociedad Anonima',
          identification_type: '02',
          identification_number: '3101123456',
          currency_code: 'CRC',
          timezone: 'America/Costa_Rica',
          language: 'es-CR',
          country: 'Costa Rica',
          province: 'Guanacaste',
          canton: 'Liberia',
          district: 'Liberia',
          address: 'Centro',
        },
        owner: {
          owner_name: 'Israel',
          owner_last_name: 'Rodriguez',
          owner_email: 'owner@test.com',
          owner_password: 'ClaveSegura123!',
        },
        initial_branch: {
          branch_name: 'Liberia',
          branch_number: '001',
          branch_identification_type: '02',
          branch_identification_number: '3101123456',
          branch_address: 'Centro',
          branch_province: 'Guanacaste',
          branch_canton: 'Liberia',
          branch_district: 'Liberia',
        },
      } as never),
    ).resolves.toEqual({
      onboarding_ready: true,
    });
  });
});
