import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { User } from '../entities/user.entity';

const user_relations = {
  user_roles: {
    role: {
      role_permissions: {
        permission: true,
      },
    },
  },
  user_branch_access: {
    branch: true,
  },
} as const;

@Injectable()
export class UsersRepository {
  constructor(
    @InjectRepository(User)
    private readonly user_repository: Repository<User>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<User>): User {
    return this.user_repository.create(payload);
  }

  async save(user: User): Promise<User> {
    const saved_user = await this.user_repository.save(user);
    return this.entity_code_service.ensure_code(
      this.user_repository,
      saved_user,
      'US',
    );
  }

  async find_all_by_business(business_id: number): Promise<User[]> {
    return this.user_repository.find({
      where: {
        business_id,
      },
      relations: user_relations,
      order: {
        name: 'ASC',
      },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<User | null> {
    return this.user_repository.findOne({
      where: {
        id,
        business_id,
      },
      relations: user_relations,
    });
  }

  async find_by_id_in_business_with_password(
    id: number,
    business_id: number,
  ): Promise<User | null> {
    return this.user_repository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.user_roles', 'user_role')
      .leftJoinAndSelect('user_role.role', 'role')
      .leftJoinAndSelect('role.role_permissions', 'role_permission')
      .leftJoinAndSelect('role_permission.permission', 'permission')
      .leftJoinAndSelect('user.user_branch_access', 'user_branch_access')
      .leftJoinAndSelect('user_branch_access.branch', 'branch')
      .where('user.id = :id', { id })
      .andWhere('user.business_id = :business_id', { business_id })
      .getOne();
  }

  async find_by_email_for_login(
    business_id: number,
    email: string,
  ): Promise<User | null> {
    return this.user_repository
      .createQueryBuilder('user')
      .addSelect('user.password_hash')
      .leftJoinAndSelect('user.user_roles', 'user_role')
      .leftJoinAndSelect('user_role.role', 'role')
      .leftJoinAndSelect('role.role_permissions', 'role_permission')
      .leftJoinAndSelect('role_permission.permission', 'permission')
      .leftJoinAndSelect('user.user_branch_access', 'user_branch_access')
      .leftJoinAndSelect('user_branch_access.branch', 'branch')
      .where('user.business_id = :business_id', { business_id })
      .andWhere('LOWER(user.email) = LOWER(:email)', { email })
      .getOne();
  }

  async exists_email_in_business(
    business_id: number,
    email: string,
    excluded_user_id?: number,
  ): Promise<boolean> {
    const query_builder = this.user_repository
      .createQueryBuilder('user')
      .where('user.business_id = :business_id', { business_id })
      .andWhere('LOWER(user.email) = LOWER(:email)', { email });

    if (excluded_user_id) {
      query_builder.andWhere('user.id != :excluded_user_id', {
        excluded_user_id,
      });
    }

    const count = await query_builder.getCount();
    return count > 0;
  }
}
