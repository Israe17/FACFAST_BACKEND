import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Permission } from '../entities/permission.entity';

@Injectable()
export class PermissionsRepository {
  constructor(
    @InjectRepository(Permission)
    private readonly permission_repository: Repository<Permission>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async find_all(): Promise<Permission[]> {
    return this.permission_repository.find({
      order: {
        module: 'ASC',
        action: 'ASC',
      },
    });
  }

  async find_by_ids(ids: number[]): Promise<Permission[]> {
    if (!ids.length) {
      return [];
    }

    return this.permission_repository.find({
      where: {
        id: In(ids),
      },
      order: {
        key: 'ASC',
      },
    });
  }

  async find_by_keys(keys: string[]): Promise<Permission[]> {
    if (!keys.length) {
      return [];
    }

    return this.permission_repository.find({
      where: {
        key: In(keys),
      },
    });
  }

  async find_by_key(key: string): Promise<Permission | null> {
    return this.permission_repository.findOne({
      where: {
        key,
      },
    });
  }

  create(payload: Partial<Permission>): Permission {
    return this.permission_repository.create(payload);
  }

  async save(permission: Permission): Promise<Permission> {
    const saved_permission = await this.permission_repository.save(permission);
    return this.entity_code_service.ensure_code(
      this.permission_repository,
      saved_permission,
      'PM',
    );
  }
}
