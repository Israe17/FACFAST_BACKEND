import { ConflictException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import type { BranchesRepository } from '../../branches/repositories/branches.repository';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { RolesRepository } from '../../rbac/repositories/roles.repository';
import type { UserBranchAccess } from '../entities/user-branch-access.entity';
import type { UserRole } from '../entities/user-role.entity';
import type { User } from '../entities/user.entity';
import { UserManagementPolicy } from '../policies/user-management.policy';
import { UsersRepository } from '../repositories/users.repository';
import { UsersService } from './users.service';

describe('UsersService', () => {
  const users_repository = {
    exists_email_in_business: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find_by_id_in_business: jest.fn(),
    find_by_email_for_login: jest.fn(),
    find_by_id_in_business_with_password: jest.fn(),
    find_all_by_business: jest.fn(),
  } as unknown as jest.Mocked<UsersRepository>;

  const roles_repository = {
    find_many_by_ids_in_business: jest.fn(),
  } as unknown as jest.Mocked<RolesRepository>;

  const branches_repository = {
    find_many_by_ids_in_business: jest.fn(),
  } as unknown as BranchesRepository;

  const user_role_repository = {
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Partial<UserRole>) => value),
  } as unknown as Repository<UserRole>;

  const user_branch_access_repository = {
    delete: jest.fn(),
    save: jest.fn(),
    create: jest.fn((value: Partial<UserBranchAccess>) => value),
  } as unknown as Repository<UserBranchAccess>;

  let service: UsersService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UsersService(
      users_repository,
      roles_repository,
      branches_repository,
      new UserManagementPolicy(),
      new BranchAccessPolicy(),
      {
        hash: jest.fn().mockResolvedValue('hash'),
      } as unknown as PasswordHashService,
      {
        validate_code: jest.fn(),
      } as unknown as EntityCodeService,
      user_role_repository,
      user_branch_access_repository,
    );
  });

  it('rejects duplicate emails inside the same business', async () => {
    users_repository.exists_email_in_business.mockResolvedValue(true);

    await expect(
      service.create_user(
        {
          id: 1,
          business_id: 1,
          email: 'admin@test.com',
          name: 'Admin',
          roles: ['admin'],
          permissions: ['users.create'],
          branch_ids: [1],
          max_sale_discount: 0,
          user_type: UserType.OWNER,
        },
        {
          name: 'Cashier',
          email: 'cashier@test.com',
          password: 'Password123',
        },
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('resolves effective roles, permissions and branches for authenticated context', async () => {
    users_repository.find_by_id_in_business.mockResolvedValue({
      id: 10,
      business_id: 2,
      email: 'manager@test.com',
      name: 'Manager',
      status: UserStatus.ACTIVE,
      allow_login: true,
      user_type: UserType.STAFF,
      max_sale_discount: 12.5,
      user_roles: [
        {
          role: {
            role_key: 'admin',
            role_permissions: [
              { permission: { key: 'users.view' } },
              { permission: { key: 'branches.view' } },
            ],
          },
        },
        {
          role: {
            role_key: 'branch_manager',
            role_permissions: [{ permission: { key: 'branches.view' } }],
          },
        },
      ],
      user_branch_access: [
        { branch_id: 5 },
        { branch_id: 2 },
        { branch_id: 5 },
      ],
    } as unknown as User);

    await expect(
      service.get_authenticated_context(10, 2, true),
    ).resolves.toEqual({
      id: 10,
      business_id: 2,
      email: 'manager@test.com',
      name: 'Manager',
      roles: ['admin', 'branch_manager'],
      permissions: ['branches.view', 'users.view'],
      branch_ids: [2, 5],
      max_sale_discount: 12.5,
      user_type: UserType.STAFF,
    });
  });
});
