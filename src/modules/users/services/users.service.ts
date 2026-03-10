import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { RolesRepository } from '../../rbac/repositories/roles.repository';
import { AssignUserBranchesDto } from '../dto/assign-user-branches.dto';
import { AssignUserRolesDto } from '../dto/assign-user-roles.dto';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UpdateUserPasswordDto } from '../dto/update-user-password.dto';
import { UpdateUserStatusDto } from '../dto/update-user-status.dto';
import { UserBranchAccess } from '../entities/user-branch-access.entity';
import { UserRole } from '../entities/user-role.entity';
import { User } from '../entities/user.entity';
import { UserManagementPolicy } from '../policies/user-management.policy';
import { UsersRepository } from '../repositories/users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly users_repository: UsersRepository,
    private readonly roles_repository: RolesRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly user_management_policy: UserManagementPolicy,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly password_hash_service: PasswordHashService,
    private readonly entity_code_service: EntityCodeService,
    @InjectRepository(UserRole)
    private readonly user_role_repository: Repository<UserRole>,
    @InjectRepository(UserBranchAccess)
    private readonly user_branch_access_repository: Repository<UserBranchAccess>,
  ) {}

  async get_users(current_user: AuthenticatedUserContext) {
    const users = await this.users_repository.find_all_by_business(
      current_user.business_id,
    );
    return users.map((user) => this.serialize_user(user));
  }

  async create_user(
    current_user: AuthenticatedUserContext,
    dto: CreateUserDto,
  ) {
    if (
      await this.users_repository.exists_email_in_business(
        current_user.business_id,
        dto.email,
      )
    ) {
      throw new ConflictException(
        'A user with this email already exists in the business.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('US', dto.code);
    }

    this.assert_user_type_assignment(current_user, dto.user_type);

    const user = this.users_repository.create({
      business_id: current_user.business_id,
      code: dto.code ?? null,
      name: dto.name.trim(),
      email: dto.email.trim().toLowerCase(),
      password_hash: await this.password_hash_service.hash(dto.password),
      status: dto.status ?? UserStatus.ACTIVE,
      allow_login: dto.allow_login ?? true,
      user_type: dto.user_type ?? UserType.STAFF,
      max_sale_discount: dto.max_sale_discount ?? 0,
      last_login_at: null,
    });

    const saved_user = await this.users_repository.save(user);
    await this.sync_roles(current_user, saved_user, dto.role_ids ?? []);
    await this.sync_branches(current_user, saved_user, dto.branch_ids ?? []);

    const hydrated_user = await this.get_user_entity(
      current_user,
      saved_user.id,
    );
    return this.serialize_user(hydrated_user);
  }

  async get_user(current_user: AuthenticatedUserContext, user_id: number) {
    const user = await this.get_user_entity(current_user, user_id);
    return this.serialize_user(user);
  }

  async update_user(
    current_user: AuthenticatedUserContext,
    user_id: number,
    dto: UpdateUserDto,
  ) {
    const user = await this.get_user_entity(current_user, user_id);

    if (dto.email) {
      const duplicated = await this.users_repository.exists_email_in_business(
        current_user.business_id,
        dto.email,
        user.id,
      );
      if (duplicated) {
        throw new ConflictException(
          'A user with this email already exists in the business.',
        );
      }
      user.email = dto.email.trim().toLowerCase();
    }

    if (dto.code) {
      this.entity_code_service.validate_code('US', dto.code);
      user.code = dto.code;
    }

    this.assert_user_type_assignment(current_user, dto.user_type);

    if (dto.name) {
      user.name = dto.name.trim();
    }
    if (dto.allow_login !== undefined) {
      user.allow_login = dto.allow_login;
    }
    if (dto.user_type) {
      user.user_type = dto.user_type;
    }
    if (dto.max_sale_discount !== undefined) {
      user.max_sale_discount = dto.max_sale_discount;
    }

    return this.serialize_user(await this.users_repository.save(user));
  }

  async update_user_status(
    current_user: AuthenticatedUserContext,
    user_id: number,
    dto: UpdateUserStatusDto,
  ) {
    const user = await this.get_user_entity(current_user, user_id);
    user.status = dto.status;
    if (dto.allow_login !== undefined) {
      user.allow_login = dto.allow_login;
    }

    return this.serialize_user(await this.users_repository.save(user));
  }

  async update_user_password(
    current_user: AuthenticatedUserContext,
    user_id: number,
    dto: UpdateUserPasswordDto,
  ) {
    const user = await this.get_user_entity(current_user, user_id);
    user.password_hash = await this.password_hash_service.hash(dto.password);
    await this.users_repository.save(user);
    return {
      success: true,
    };
  }

  async assign_roles(
    current_user: AuthenticatedUserContext,
    user_id: number,
    dto: AssignUserRolesDto,
  ) {
    const user = await this.get_user_entity(current_user, user_id);
    await this.sync_roles(current_user, user, dto.role_ids);
    return this.get_user(current_user, user_id);
  }

  async assign_branches(
    current_user: AuthenticatedUserContext,
    user_id: number,
    dto: AssignUserBranchesDto,
  ) {
    const user = await this.get_user_entity(current_user, user_id);
    await this.sync_branches(current_user, user, dto.branch_ids);
    return this.get_user(current_user, user_id);
  }

  async get_effective_permissions(
    current_user: AuthenticatedUserContext,
    user_id: number,
  ) {
    const user = await this.get_user_entity(current_user, user_id);
    return this.build_authenticated_context(user);
  }

  async get_authenticated_context(
    user_id: number,
    business_id: number,
    active_only = true,
  ): Promise<AuthenticatedUserContext | null> {
    const user = await this.users_repository.find_by_id_in_business(
      user_id,
      business_id,
    );
    if (!user) {
      return null;
    }

    if (
      active_only &&
      (user.status !== UserStatus.ACTIVE || user.allow_login === false)
    ) {
      return null;
    }

    return this.build_authenticated_context(user);
  }

  async find_user_for_login(
    business_id: number,
    email: string,
  ): Promise<User | null> {
    return this.users_repository.find_by_email_for_login(business_id, email);
  }

  async update_last_login(user_id: number, business_id: number): Promise<void> {
    const user =
      await this.users_repository.find_by_id_in_business_with_password(
        user_id,
        business_id,
      );
    if (!user) {
      return;
    }

    user.last_login_at = new Date();
    await this.users_repository.save(user);
  }

  private async get_user_entity(
    current_user: AuthenticatedUserContext,
    user_id: number,
  ): Promise<User> {
    const user = await this.users_repository.find_by_id_in_business(
      user_id,
      current_user.business_id,
    );
    if (!user) {
      throw new NotFoundException('User not found.');
    }

    this.user_management_policy.assert_can_manage_user(current_user, user);
    return user;
  }

  private async sync_roles(
    current_user: AuthenticatedUserContext,
    user: User,
    role_ids: number[],
  ): Promise<void> {
    const roles = await this.roles_repository.find_many_by_ids_in_business(
      role_ids,
      current_user.business_id,
    );
    if (roles.length !== role_ids.length) {
      throw new BadRequestException(
        'One or more roles do not belong to the business.',
      );
    }

    await this.user_role_repository.delete({
      user_id: user.id,
    });
    if (roles.length) {
      await this.user_role_repository.save(
        roles.map((role) =>
          this.user_role_repository.create({
            user_id: user.id,
            role_id: role.id,
          }),
        ),
      );
    }
  }

  private async sync_branches(
    current_user: AuthenticatedUserContext,
    user: User,
    branch_ids: number[],
  ): Promise<void> {
    this.branch_access_policy.assert_manageable_branch_ids(
      current_user,
      branch_ids,
    );

    const branches =
      await this.branches_repository.find_many_by_ids_in_business(
        branch_ids,
        current_user.business_id,
      );
    if (branches.length !== branch_ids.length) {
      throw new BadRequestException(
        'One or more branches do not belong to the authenticated business.',
      );
    }

    await this.user_branch_access_repository.delete({
      user_id: user.id,
    });
    if (branches.length) {
      await this.user_branch_access_repository.save(
        branches.map((branch) =>
          this.user_branch_access_repository.create({
            user_id: user.id,
            branch_id: branch.id,
          }),
        ),
      );
    }
  }

  private assert_user_type_assignment(
    current_user: AuthenticatedUserContext,
    user_type?: UserType,
  ): void {
    if (!user_type) {
      return;
    }

    if (user_type === UserType.SYSTEM) {
      throw new BadRequestException(
        'System users cannot be created or updated through the API.',
      );
    }

    if (user_type === UserType.OWNER) {
      this.user_management_policy.assert_can_assign_owner_user_type(
        current_user,
      );
    }
  }

  private build_authenticated_context(user: User): AuthenticatedUserContext {
    const roles = user.user_roles
      ?.map((user_role) => user_role.role?.role_key)
      .filter(Boolean) as string[];
    const permissions = new Set<string>();
    for (const user_role of user.user_roles ?? []) {
      for (const role_permission of user_role.role?.role_permissions ?? []) {
        if (role_permission.permission?.key) {
          permissions.add(role_permission.permission.key);
        }
      }
    }

    const branch_ids = [
      ...new Set((user.user_branch_access ?? []).map((item) => item.branch_id)),
    ].sort((left, right) => left - right);

    return {
      id: user.id,
      business_id: user.business_id,
      email: user.email,
      name: user.name,
      roles,
      permissions: [...permissions].sort(),
      branch_ids,
      max_sale_discount: Number(user.max_sale_discount ?? 0),
      user_type: user.user_type,
    };
  }

  private serialize_user(user: User) {
    return {
      id: user.id,
      code: user.code,
      business_id: user.business_id,
      name: user.name,
      email: user.email,
      status: user.status,
      allow_login: user.allow_login,
      user_type: user.user_type,
      max_sale_discount: Number(user.max_sale_discount ?? 0),
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      updated_at: user.updated_at,
      roles:
        user.user_roles?.map((user_role) => ({
          id: user_role.role?.id,
          code: user_role.role?.code,
          name: user_role.role?.name,
          role_key: user_role.role?.role_key,
          is_system: user_role.role?.is_system,
        })) ?? [],
      branch_ids: (user.user_branch_access ?? [])
        .map((item) => item.branch_id)
        .sort((left, right) => left - right),
      branches:
        user.user_branch_access?.map((item) => ({
          id: item.branch?.id ?? item.branch_id,
          code: item.branch?.code,
          branch_number: item.branch?.branch_number,
          business_name: item.branch?.business_name,
        })) ?? [],
      effective_permissions: this.build_authenticated_context(user).permissions,
    };
  }
}
