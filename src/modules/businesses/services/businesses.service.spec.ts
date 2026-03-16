import type { Business } from '../../common/entities/business.entity';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { UserType } from '../../common/enums/user-type.enum';
import type { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { BusinessesRepository } from '../repositories/businesses.repository';
import { BusinessesService } from './businesses.service';

describe('BusinessesService', () => {
  const find_by_id = jest.fn();
  const save = jest.fn();
  const validate_code = jest.fn();

  const businesses_repository = {
    find_by_id,
    save,
  } as unknown as jest.Mocked<BusinessesRepository>;

  const entity_code_service = {
    validate_code,
  } as unknown as jest.Mocked<EntityCodeService>;

  const current_user: AuthenticatedUserContext = {
    id: 10,
    business_id: 7,
    email: 'owner@test.com',
    name: 'Owner',
    roles: ['owner'],
    permissions: ['businesses.view', 'businesses.update'],
    branch_ids: [1],
    max_sale_discount: 0,
    user_type: UserType.OWNER,
    is_platform_admin: false,
    acting_business_id: null,
    acting_branch_id: null,
    mode: AuthenticatedUserMode.TENANT,
    session_id: null,
  };

  let service: BusinessesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BusinessesService(businesses_repository, entity_code_service);
  });

  it('returns the current business for the authenticated tenant', async () => {
    businesses_repository.find_by_id.mockResolvedValue(
      build_business({
        id: 7,
        code: 'BS-0007',
        name: 'Multillantas',
        currency_code: 'CRC',
      }),
    );

    await expect(
      service.get_current_business(current_user),
    ).resolves.toMatchObject({
      id: 7,
      code: 'BS-0007',
      name: 'Multillantas',
      currency_code: 'CRC',
      permissions: {
        can_view: true,
        can_update: true,
      },
    });
  });

  it('updates the current business and normalizes optional fields', async () => {
    const persisted_business = build_business({
      id: 7,
      code: 'BS-0007',
      name: '  Multillantas  ',
      legal_name: '  Multillantas Sociedad Anonima  ',
      currency_code: 'crc',
      email: '   ',
      country: '  Costa Rica  ',
    });

    businesses_repository.find_by_id.mockResolvedValue(persisted_business);
    businesses_repository.save.mockImplementation((business) =>
      Promise.resolve(business),
    );

    await expect(
      service.update_current_business(current_user, {
        code: 'BS-0009',
        name: '  Multillantas CR  ',
        legal_name: '  Multillantas Sociedad Anonima  ',
        identification_type: IdentificationType.LEGAL,
        identification_number: ' 3101123456 ',
        currency_code: 'usd',
        timezone: '  America/Costa_Rica  ',
        language: '  en-US  ',
        email: '   ',
        phone: ' 2222-3333 ',
        website: ' https://multillantas.com ',
        logo_url: ' https://cdn.multillantas.com/logo.png ',
        country: '  Costa Rica  ',
        province: ' Guanacaste ',
        canton: ' Liberia ',
        district: ' Liberia ',
        city: ' Liberia ',
        address: ' Frente al parque ',
        postal_code: ' 50101 ',
        is_active: false,
      }),
    ).resolves.toMatchObject({
      code: 'BS-0009',
      name: 'Multillantas CR',
      legal_name: 'Multillantas Sociedad Anonima',
      identification_type: IdentificationType.LEGAL,
      identification_number: '3101123456',
      currency_code: 'USD',
      timezone: 'America/Costa_Rica',
      language: 'en-US',
      email: null,
      phone: '2222-3333',
      website: 'https://multillantas.com',
      logo_url: 'https://cdn.multillantas.com/logo.png',
      country: 'Costa Rica',
      province: 'Guanacaste',
      canton: 'Liberia',
      district: 'Liberia',
      city: 'Liberia',
      address: 'Frente al parque',
      postal_code: '50101',
      is_active: false,
    });

    expect(validate_code).toHaveBeenCalledWith('BS', 'BS-0009');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'BS-0009',
        currency_code: 'USD',
        email: null,
      }),
    );
  });

  it('fails when the current business does not exist', async () => {
    businesses_repository.find_by_id.mockResolvedValue(null);

    await expect(
      service.get_current_business({
        ...current_user,
        business_id: 999,
      }),
    ).rejects.toBeInstanceOf(DomainNotFoundException);
  });
});

function build_business(overrides: Partial<Business> = {}): Business {
  return {
    id: 7,
    code: 'BS-0007',
    identification_type: IdentificationType.LEGAL,
    identification_number: '3101123456',
    currency_code: 'CRC',
    timezone: 'America/Costa_Rica',
    language: 'es-CR',
    name: 'Multillantas',
    legal_name: 'Multillantas Sociedad Anonima',
    email: 'empresa@test.com',
    phone: '2222-3333',
    website: null,
    logo_url: null,
    country: 'Costa Rica',
    province: 'Guanacaste',
    canton: 'Liberia',
    district: 'Liberia',
    city: 'Liberia',
    address: 'Centro',
    postal_code: '50101',
    is_active: true,
    created_at: new Date('2026-01-01T00:00:00.000Z'),
    updated_at: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  } as Business;
}
