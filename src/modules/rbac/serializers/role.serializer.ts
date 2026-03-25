import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { RoleView } from '../contracts/role.view';
import { Role } from '../entities/role.entity';
import { PermissionSerializer } from './permission.serializer';

@Injectable()
export class RoleSerializer implements EntitySerializer<Role, RoleView> {
  constructor(
    private readonly permission_serializer: PermissionSerializer,
  ) {}

  serialize(role: Role): RoleView {
    return {
      id: role.id,
      code: role.code,
      business_id: role.business_id,
      name: role.name,
      role_key: role.role_key,
      is_system: role.is_system,
      permissions:
        role.role_permissions
          ?.filter((role_permission) => Boolean(role_permission.permission))
          .map((role_permission) =>
            this.permission_serializer.serialize(role_permission.permission!),
          ) ?? [],
      lifecycle: {
        can_update: true,
        can_delete: !role.is_system,
        can_assign_permissions: true,
        reasons: role.is_system ? ['system_role'] : [],
      },
      created_at: role.created_at,
      updated_at: role.updated_at,
    };
  }
}
