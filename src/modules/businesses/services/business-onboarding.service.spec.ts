import { DataSource } from 'typeorm';
import { Branch } from '../../branches/entities/branch.entity';
import { Terminal } from '../../branches/entities/terminal.entity';
import { Business } from '../../common/entities/business.entity';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { Role } from '../../rbac/entities/role.entity';
import { RbacSeedService } from '../../rbac/services/rbac-seed.service';
import { UserBranchAccess } from '../../users/entities/user-branch-access.entity';
import { UserRole } from '../../users/entities/user-role.entity';
import { User } from '../../users/entities/user.entity';
import { BusinessOnboardingService } from './business-onboarding.service';

describe('BusinessOnboardingService', () => {
  const transaction = jest.fn();
  const hash = jest.fn();
  const ensure_code = jest.fn();
  const seed_base_permissions_in_manager = jest.fn();
  const ensure_suggested_roles_for_business_in_manager = jest.fn();

  const data_source = {
    transaction,
  } as unknown as jest.Mocked<DataSource>;

  const password_hash_service = {
    hash,
  } as unknown as jest.Mocked<PasswordHashService>;

  const entity_code_service = {
    ensure_code,
  } as unknown as jest.Mocked<EntityCodeService>;

  const rbac_seed_service = {
    seed_base_permissions_in_manager,
    ensure_suggested_roles_for_business_in_manager,
  } as unknown as jest.Mocked<RbacSeedService>;

  let service: BusinessOnboardingService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new BusinessOnboardingService(
      data_source,
      password_hash_service,
      entity_code_service,
      rbac_seed_service,
    );
  });

  it('creates the tenant, owner, initial branch and initial terminal', async () => {
    const business_repository = create_mock_repository();
    const user_repository = create_mock_repository();
    const role_repository = create_mock_repository();
    const user_role_repository = create_mock_repository();
    const user_branch_access_repository = create_mock_repository();
    const branch_repository = create_mock_repository();
    const terminal_repository = create_mock_repository();

    business_repository.findOne.mockResolvedValue(null);
    user_repository.findOne.mockResolvedValue(null);
    role_repository.findOne.mockResolvedValue({
      id: 33,
      code: 'RL-0033',
      name: 'Owner',
      role_key: 'owner',
      business_id: 1,
      is_system: true,
    });

    const manager = build_manager([
      [Business, business_repository],
      [User, user_repository],
      [Role, role_repository],
      [UserRole, user_role_repository],
      [UserBranchAccess, user_branch_access_repository],
      [Branch, branch_repository],
      [Terminal, terminal_repository],
    ]);

    transaction.mockImplementation(
      async (
        callback: (transaction_manager: typeof manager) => Promise<unknown>,
      ): Promise<unknown> => {
        return callback(manager);
      },
    );
    hash.mockResolvedValue('hashed-password');
    ensure_code.mockImplementation(
      <T extends MockCodeEntity>(
        _: unknown,
        entity: T,
        prefix: string,
      ): Promise<T> =>
        Promise.resolve({
          ...entity,
          code:
            entity.code ?? `${prefix}-${String(entity.id).padStart(4, '0')}`,
        }),
    );

    const result = await service.onboard_business({
      business: {
        name: 'Multillantas',
        legal_name: 'Multillantas Sociedad Anonima',
        identification_type: IdentificationType.LEGAL,
        identification_number: '3101123456',
        currency_code: 'CRC',
        timezone: 'America/Costa_Rica',
        language: 'es-CR',
        email: 'empresa@multillantas.com',
        phone: '2222-3333',
        website: 'https://multillantas.com',
        logo_url: null,
        country: 'Costa Rica',
        province: 'Guanacaste',
        canton: 'Liberia',
        district: 'Liberia',
        city: 'Liberia',
        address: 'Frente al parque central',
        postal_code: '50101',
        is_active: true,
      },
      owner: {
        owner_name: 'Israel',
        owner_last_name: 'Rodriguez',
        owner_email: 'owner@multillantas.com',
        owner_password: 'ClaveSegura123!',
      },
      initial_branch: {
        branch_name: 'Liberia',
        branch_number: '001',
        branch_identification_type: IdentificationType.LEGAL,
        branch_identification_number: '3101123456',
        branch_email: 'liberia@multillantas.com',
        branch_phone: '2666-7777',
        branch_address: '200m oeste del parque central',
        branch_province: 'Guanacaste',
        branch_canton: 'Liberia',
        branch_district: 'Liberia',
        branch_city: 'Liberia',
        activity_code: '123456',
        provider_code: 'PROV-01',
        is_active: true,
      },
      initial_terminal: {
        create_initial_terminal: true,
        terminal_name: 'Caja 1',
        terminal_number: '00001',
      },
    });

    expect(seed_base_permissions_in_manager).toHaveBeenCalled();
    expect(ensure_suggested_roles_for_business_in_manager).toHaveBeenCalledWith(
      1,
      manager,
    );
    expect(hash).toHaveBeenCalledWith('ClaveSegura123!');
    expect(user_branch_access_repository.save).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 1,
        branch_id: 1,
      }),
    );
    expect(result).toMatchObject({
      onboarding_ready: true,
      business: {
        id: 1,
        code: 'BS-0001',
        name: 'Multillantas',
      },
      owner: {
        id: 1,
        code: 'US-0001',
        email: 'owner@multillantas.com',
      },
      initial_branch: {
        id: 1,
        code: 'BR-0001',
        business_name: 'Multillantas Liberia',
      },
      initial_terminal: {
        id: 1,
        code: 'TR-0001',
        terminal_number: '00001',
      },
    });
  });

  it('fails when the owner email already exists', async () => {
    const business_repository = create_mock_repository();
    const user_repository = create_mock_repository();

    business_repository.findOne.mockResolvedValue(null);
    user_repository.findOne.mockResolvedValue({
      id: 99,
      email: 'owner@multillantas.com',
    });

    const manager = build_manager([
      [Business, business_repository],
      [User, user_repository],
      [Role, create_mock_repository()],
      [UserRole, create_mock_repository()],
      [UserBranchAccess, create_mock_repository()],
      [Branch, create_mock_repository()],
      [Terminal, create_mock_repository()],
    ]);

    transaction.mockImplementation(
      async (
        callback: (transaction_manager: typeof manager) => Promise<unknown>,
      ): Promise<unknown> => {
        return callback(manager);
      },
    );

    await expect(
      service.onboard_business({
        business: {
          name: 'Multillantas',
          legal_name: 'Multillantas Sociedad Anonima',
          identification_type: IdentificationType.LEGAL,
          identification_number: '3101123456',
          currency_code: 'CRC',
          timezone: 'America/Costa_Rica',
          language: 'es-CR',
          country: 'Costa Rica',
          province: 'Guanacaste',
          canton: 'Liberia',
          district: 'Liberia',
          address: 'Frente al parque central',
        },
        owner: {
          owner_name: 'Israel',
          owner_last_name: 'Rodriguez',
          owner_email: 'owner@multillantas.com',
          owner_password: 'ClaveSegura123!',
        },
        initial_branch: {
          branch_name: 'Liberia',
          branch_number: '001',
          branch_identification_type: IdentificationType.LEGAL,
          branch_identification_number: '3101123456',
          branch_address: '200m oeste del parque central',
          branch_province: 'Guanacaste',
          branch_canton: 'Liberia',
          branch_district: 'Liberia',
        },
      }),
    ).rejects.toBeInstanceOf(DomainConflictException);
  });
});

type MockEntity = Record<string, unknown>;
type MockCodeEntity = MockEntity & {
  code?: string | null;
  id: number;
};
type EntityToken = abstract new (...args: never[]) => object;

type MockRepository = {
  findOne: jest.Mock<Promise<MockEntity | null>, [unknown?]>;
  create: jest.Mock<MockEntity, [MockEntity]>;
  save: jest.Mock<Promise<MockEntity>, [MockEntity]>;
};

function create_mock_repository(): MockRepository {
  let sequence = 0;

  return {
    findOne: jest.fn<Promise<MockEntity | null>, [unknown?]>(),
    create: jest.fn((payload: MockEntity): MockEntity => payload),
    save: jest.fn(
      (entity: MockEntity): Promise<MockEntity> =>
        Promise.resolve({
          ...entity,
          id:
            (typeof entity.id === 'number' ? entity.id : undefined) ??
            ++sequence,
          created_at:
            entity.created_at instanceof Date
              ? entity.created_at
              : new Date('2026-01-01T00:00:00.000Z'),
          updated_at: new Date('2026-01-01T00:00:00.000Z'),
        }),
    ),
  };
}

function build_manager(repositories: Array<[EntityToken, MockRepository]>) {
  const repository_map = new Map(repositories);

  return {
    getRepository(entity: EntityToken): MockRepository {
      const repository = repository_map.get(entity);
      if (!repository) {
        throw new Error(`Missing mock repository for ${entity.name}`);
      }

      return repository;
    },
  };
}
