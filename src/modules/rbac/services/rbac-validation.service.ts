import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { UserRole } from '../../users/entities/user-role.entity';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';
import { RoleAccessPolicy } from '../policies/role-access.policy';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { RolesRepository } from '../repositories/roles.repository';

@Injectable()
export class RbacValidationService {
  constructor(
    private readonly roles_repository: RolesRepository,
    private readonly permissions_repository: PermissionsRepository,
    private readonly role_access_policy: RoleAccessPolicy,
    @InjectRepository(UserRole)
    private readonly user_role_repository: Repository<UserRole>,
  ) {}

  async get_role_for_access(
    current_user: AuthenticatedUserContext,
    role_id: number,
  ): Promise<Role> {
    const role = await this.roles_repository.find_by_id_in_business(
      role_id,
      resolve_effective_business_id(current_user),
    );
    if (!role) {
      throw new DomainNotFoundException({
        code: 'ROLE_NOT_FOUND',
        messageKey: 'rbac.role_not_found',
        details: {
          role_id,
        },
      });
    }

    this.role_access_policy.assert_can_access_role(current_user, role);
    return role;
  }

  async assert_role_key_available(
    business_id: number,
    role_key: string,
    exclude_role_id?: number,
  ): Promise<void> {
    const existing_role = await this.roles_repository.find_by_role_key(
      business_id,
      role_key,
    );
    if (existing_role && existing_role.id !== exclude_role_id) {
      throw new DomainConflictException({
        code: 'ROLE_KEY_DUPLICATE',
        messageKey: 'rbac.role_key_duplicate',
        details: {
          field: 'role_key',
        },
      });
    }
  }

  async get_permissions_by_ids(permission_ids: number[]): Promise<Permission[]> {
    const permissions =
      await this.permissions_repository.find_by_ids(permission_ids);
    if (permissions.length !== permission_ids.length) {
      throw new DomainBadRequestException({
        code: 'ROLE_PERMISSIONS_NOT_FOUND',
        messageKey: 'rbac.permissions_not_found',
        details: {
          field: 'permission_ids',
        },
      });
    }

    return permissions;
  }

  async count_role_delete_dependencies(role: {
    id: number;
  }): Promise<{ user_assignments: number }> {
    const user_assignments = await this.user_role_repository.count({
      where: {
        role_id: role.id,
      },
    });

    return {
      user_assignments,
    };
  }
}
