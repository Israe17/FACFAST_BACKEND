import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { PermissionView } from '../contracts/permission.view';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { PermissionSerializer } from '../serializers/permission.serializer';

@Injectable()
export class GetPermissionsListQueryUseCase
  implements QueryUseCase<void, PermissionView[]>
{
  constructor(
    private readonly permissions_repository: PermissionsRepository,
    private readonly permission_serializer: PermissionSerializer,
  ) {}

  async execute(): Promise<PermissionView[]> {
    const permissions = await this.permissions_repository.find_all();
    return permissions.map((permission) =>
      this.permission_serializer.serialize(permission),
    );
  }
}
