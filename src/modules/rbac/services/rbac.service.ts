import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
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
      current_user.business_id,
    );
    return roles.map((role) => this.serialize_role(role));
  }

  async create_role(
    current_user: AuthenticatedUserContext,
    dto: CreateRoleDto,
  ) {
    const existing_role = await this.roles_repository.find_by_role_key(
      current_user.business_id,
      dto.role_key,
    );
    if (existing_role) {
      throw new ConflictException(
        'A role with this role_key already exists in the business.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('RL', dto.code);
    }

    const role = this.roles_repository.create({
      business_id: current_user.business_id,
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
      current_user.business_id,
    );
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    if (dto.role_key && dto.role_key !== role.role_key) {
      const duplicated = await this.roles_repository.find_by_role_key(
        current_user.business_id,
        dto.role_key,
      );
      if (duplicated && duplicated.id !== role.id) {
        throw new ConflictException(
          'A role with this role_key already exists in the business.',
        );
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
      current_user.business_id,
    );
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    if (role.is_system) {
      throw new BadRequestException('System roles cannot be deleted.');
    }

    const assignments_count = await this.user_role_repository.count({
      where: {
        role_id: role.id,
      },
    });
    if (assignments_count > 0) {
      throw new BadRequestException('Cannot delete a role assigned to users.');
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
      current_user.business_id,
    );
    if (!role) {
      throw new NotFoundException('Role not found.');
    }

    const permissions = await this.permissions_repository.find_by_ids(
      dto.permission_ids,
    );
    if (permissions.length !== dto.permission_ids.length) {
      throw new BadRequestException('One or more permissions do not exist.');
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
      current_user.business_id,
    );
    if (!refreshed_role) {
      throw new NotFoundException('Role not found after update.');
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
