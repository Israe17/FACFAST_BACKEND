import { Injectable } from '@nestjs/common';
import { PermissionView } from '../contracts/permission.view';
import { GetPermissionsListQueryUseCase } from '../use-cases/get-permissions-list.query.use-case';

@Injectable()
export class PermissionsService {
  constructor(
    private readonly get_permissions_list_query_use_case: GetPermissionsListQueryUseCase,
  ) {}

  async find_all(): Promise<PermissionView[]> {
    return this.get_permissions_list_query_use_case.execute();
  }
}
