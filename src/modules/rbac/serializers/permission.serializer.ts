import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { PermissionView } from '../contracts/permission.view';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionSerializer
  implements EntitySerializer<Permission, PermissionView>
{
  serialize(permission: Permission): PermissionView {
    return {
      id: permission.id,
      code: permission.code,
      key: permission.key,
      module: permission.module,
      action: permission.action,
      description: permission.description,
    };
  }
}
