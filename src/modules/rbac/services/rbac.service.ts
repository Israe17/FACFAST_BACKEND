import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { UserRole } from '../../users/entities/user-role.entity';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { RolePermission } from '../entities/role-permission.entity';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { RolesRepository } from '../repositories/roles.repository';

@Injectable()
export class RbacService {
  constructor(
    private readonly roles_repository: RolesRepository,
    private readonly permissions_repository: PermissionsRepository,
    private readonly entity_code_service: EntityCodeService,
    @InjectRepository(RolePermission)
    private readonly role_permission_repository: Repository<RolePermission>,
    @InjectRepository(UserRole)
    private readonly user_role_repository: Repository<UserRole>,
  ) {}

  async get_roles(current_user: AuthenticatedUserContext) {
    const roles = await this.roles_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );
    return roles.map((role) => this.serialize_role(role));
  }

  async create_role(
    current_user: AuthenticatedUserContext,
    dto: CreateRoleDto,
  ) {
    const existing_role = await this.roles_repository.find_by_role_key(
      resolve_effective_business_id(current_user),
      dto.role_key,
    );
    if (existing_role) {
      throw new DomainConflictException({
        code: 'ROLE_KEY_DUPLICATE',
        messageKey: 'rbac.role_key_duplicate',
        details: {
          field: 'role_key',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('RL', dto.code);
    }

    const role = this.roles_repository.create({
      business_id: resolve_effective_business_id(current_user),
      code: dto.code ?? null,
      name: dto.name.trim(),
      role_key: dto.role_key.trim(),
      is_system: false,
    });

    return this.serialize_role(await this.roles_repository.save(role));
  }

  async update_role(
    current_user: AuthenticatedUserContext,
    role_id: number,
    dto: UpdateRoleDto,
  ) {
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

    if (dto.role_key && dto.role_key !== role.role_key) {
      const duplicated = await this.roles_repository.find_by_role_key(
        resolve_effective_business_id(current_user),
        dto.role_key,
      );
      if (duplicated && duplicated.id !== role.id) {
        throw new DomainConflictException({
          code: 'ROLE_KEY_DUPLICATE',
          messageKey: 'rbac.role_key_duplicate',
          details: {
            field: 'role_key',
          },
        });
      }
      role.role_key = dto.role_key.trim();
    }

    if (dto.code) {
      this.entity_code_service.validate_code('RL', dto.code);
      role.code = dto.code;
    }

    if (dto.name) {
      role.name = dto.name.trim();
    }

    return this.serialize_role(await this.roles_repository.save(role));
  }

  async delete_role(current_user: AuthenticatedUserContext, role_id: number) {
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

    if (role.is_system) {
      throw new DomainBadRequestException({
        code: 'ROLE_SYSTEM_DELETE_FORBIDDEN',
        messageKey: 'rbac.system_role_delete_forbidden',
      });
    }

    const assignments_count = await this.user_role_repository.count({
      where: {
        role_id: role.id,
      },
    });
    if (assignments_count > 0) {
      throw new DomainBadRequestException({
        code: 'ROLE_IN_USE_DELETE_FORBIDDEN',
        messageKey: 'rbac.role_in_use_delete_forbidden',
      });
    }

    await this.roles_repository.delete(role);
    return {
      success: true,
    };
  }

  async assign_permissions(
    current_user: AuthenticatedUserContext,
    role_id: number,
    dto: AssignRolePermissionsDto,
  ) {
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

    const permissions = await this.permissions_repository.find_by_ids(
      dto.permission_ids,
    );
    if (permissions.length !== dto.permission_ids.length) {
      throw new DomainBadRequestException({
        code: 'ROLE_PERMISSIONS_NOT_FOUND',
        messageKey: 'rbac.permissions_not_found',
        details: {
          field: 'permission_ids',
        },
      });
    }

    await this.role_permission_repository.delete({
      role_id: role.id,
    });
    if (permissions.length) {
      await this.role_permission_repository.save(
        permissions.map((permission) =>
          this.role_permission_repository.create({
            role_id: role.id,
            permission_id: permission.id,
          }),
        ),
      );
    }

    const refreshed_role = await this.roles_repository.find_by_id_in_business(
      role.id,
      resolve_effective_business_id(current_user),
    );
    if (!refreshed_role) {
      throw new DomainNotFoundException({
        code: 'ROLE_NOT_FOUND',
        messageKey: 'rbac.role_not_found',
        details: {
          role_id: role.id,
        },
      });
    }

    return this.serialize_role(refreshed_role);
  }

  private serialize_role(role: {
    id: number;
    code: string | null;
    business_id: number;
    name: string;
    role_key: string;
    is_system: boolean;
    created_at?: Date;
    updated_at?: Date;
    role_permissions?: {
      permission?: { id: number; key: string } | null;
      permission_id: number;
    }[];
  }) {
    return {
      id: role.id,
      code: role.code,
      business_id: role.business_id,
      name: role.name,
      role_key: role.role_key,
      is_system: role.is_system,
      created_at: role.created_at,
      updated_at: role.updated_at,
      permissions:
        role.role_permissions?.map((role_permission) => ({
          id: role_permission.permission?.id ?? role_permission.permission_id,
          key: role_permission.permission?.key,
        })) ?? [],
    };
  }
}
