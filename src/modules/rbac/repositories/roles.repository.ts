import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Role } from '../entities/role.entity';

const role_relations = {
  role_permissions: {
    permission: true,
  },
} as const;

@Injectable()
export class RolesRepository {
  constructor(
    @InjectRepository(Role)
    private readonly role_repository: Repository<Role>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Role>): Role {
    return this.role_repository.create(payload);
  }

  async save(role: Role): Promise<Role> {
    const saved_role = await this.role_repository.save(role);
    return this.entity_code_service.ensure_code(
      this.role_repository,
      saved_role,
      'RL',
    );
  }

  async find_all_by_business(business_id: number): Promise<Role[]> {
    return this.role_repository.find({
      where: {
        business_id,
      },
      relations: role_relations,
      order: {
        name: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Role | null> {
    return this.role_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: role_relations,
    });
  }

  async find_many_by_ids_in_business(
    ids: number[],
    business_id: number,
  ): Promise<Role[]> {
    if (!ids.length) {
      return [];
    }

    return this.role_repository.find({
      where: {
        id: In(ids),
        business_id,
      },
      relations: role_relations,
      order: {
        name: 'ASC',
      },
    });
  }

  async find_by_role_key(
    business_id: number,
    role_key: string,
  ): Promise<Role | null> {
    return this.role_repository.findOne({
      where: {
        business_id,
        role_key,
      },
      relations: role_relations,
    });
  }

  async delete(role: Role): Promise<void> {
    await this.role_repository.remove(role);
  }
}
