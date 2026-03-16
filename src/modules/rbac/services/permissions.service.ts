import { Injectable } from '@nestjs/common';
import { PermissionsRepository } from '../repositories/permissions.repository';
import { serialize_permission } from '../utils/serialize-permission.util';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissions_repository: PermissionsRepository) {}

  async find_all() {
    const permissions = await this.permissions_repository.find_all();
    return permissions.map((permission) => serialize_permission(permission));
  }
}
