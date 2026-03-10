import { Injectable } from '@nestjs/common';
import { Permission } from '../entities/permission.entity';
import { PermissionsRepository } from '../repositories/permissions.repository';

@Injectable()
export class PermissionsService {
  constructor(private readonly permissions_repository: PermissionsRepository) {}

  async find_all(): Promise<Permission[]> {
    return this.permissions_repository.find_all();
  }
}
