import { Permission } from '../entities/permission.entity';

export function serialize_permission(permission: Permission) {
  return {
    id: permission.id,
    code: permission.code,
    key: permission.key,
    module: permission.module,
    action: permission.action,
    description: permission.description,
  };
}
