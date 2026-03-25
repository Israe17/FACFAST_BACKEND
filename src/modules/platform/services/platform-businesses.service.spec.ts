import { GetPlatformBusinessBranchesQueryUseCase } from '../use-cases/get-platform-business-branches.query.use-case';
import { GetPlatformBusinessQueryUseCase } from '../use-cases/get-platform-business.query.use-case';
import { GetPlatformBusinessesListQueryUseCase } from '../use-cases/get-platform-businesses-list.query.use-case';
import { OnboardPlatformBusinessUseCase } from '../use-cases/onboard-platform-business.use-case';
import { PlatformBusinessesService } from './platform-businesses.service';

describe('PlatformBusinessesService', () => {
  const get_platform_businesses_list_query_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetPlatformBusinessesListQueryUseCase>;

  const get_platform_business_query_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetPlatformBusinessQueryUseCase>;

  const get_platform_business_branches_query_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<GetPlatformBusinessBranchesQueryUseCase>;

  const onboard_platform_business_use_case = {
    execute: jest.fn(),
  } as unknown as jest.Mocked<OnboardPlatformBusinessUseCase>;

  let service: PlatformBusinessesService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new PlatformBusinessesService(
      get_platform_businesses_list_query_use_case,
      get_platform_business_query_use_case,
      get_platform_business_branches_query_use_case,
      onboard_platform_business_use_case,
    );
  });

  it('lists all businesses for the platform panel', async () => {
    get_platform_businesses_list_query_use_case.execute.mockResolvedValue([
      {
        id: 1,
        code: 'BS-0001',
        name: 'Multillantas',
      },
    ] as never);

    await expect(service.get_businesses()).resolves.toMatchObject([
      {
        id: 1,
        code: 'BS-0001',
        name: 'Multillantas',
      },
    ]);
  });

  it('returns branches for the selected business', async () => {
    get_platform_business_branches_query_use_case.execute.mockResolvedValue([
      {
        id: 10,
        code: 'BR-0010',
        business_id: 7,
        business_name: 'Multillantas Liberia',
        name: 'Liberia',
        branch_number: '001',
        terminals: [],
      },
    ] as never);

    await expect(service.get_business_branches(7)).resolves.toMatchObject([
      {
        id: 10,
        business_id: 7,
        branch_number: '001',
      },
    ]);
  });

  it('returns the selected business detail', async () => {
    get_platform_business_query_use_case.execute.mockResolvedValue({
      id: 7,
      code: 'BS-0007',
      name: 'Multillantas',
    } as never);

    await expect(service.get_business(7)).resolves.toMatchObject({
      id: 7,
      code: 'BS-0007',
    });
  });

  it('delegates onboarding to the existing business onboarding flow', async () => {
    onboard_platform_business_use_case.execute.mockResolvedValue({
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
