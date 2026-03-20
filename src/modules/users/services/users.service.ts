import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { UserStatus } from '../../common/enums/user-status.enum';
import { UserType } from '../../common/enums/user-type.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { PasswordHashService } from '../../common/services/password-hash.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryMovementHeader } from '../../inventory/entities/inventory-movement-header.entity';
import { InventoryMovement } from '../../inventory/entities/inventory-movement.entity';
import { SerialEvent } from '../../inventory/entities/serial-event.entity';
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

type SessionContextState = {
  session_id?: number | null;
  acting_business_id?: number | null;
  acting_branch_id?: number | null;
};

@Injectable()
export class UsersService {
  constructor(
    private readonly users_repository: UsersRepository,
    private readonly roles_repository: RolesRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly businesses_repository: BusinessesRepository,
    private readonly user_management_policy: UserManagementPolicy,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly password_hash_service: PasswordHashService,
    private readonly entity_code_service: EntityCodeService,
    @InjectRepository(UserRole)
    private readonly user_role_repository: Repository<UserRole>,
    @InjectRepository(UserBranchAccess)
    private readonly user_branch_access_repository: Repository<UserBranchAccess>,
    @InjectRepository(InventoryMovementHeader)
    private readonly inventory_movement_header_repository: Repository<InventoryMovementHeader>,
    @InjectRepository(InventoryMovement)
    private readonly inventory_movement_repository: Repository<InventoryMovement>,
    @InjectRepository(SerialEvent)
    private readonly serial_event_repository: Repository<SerialEvent>,
  ) {}

  async get_users(current_user: AuthenticatedUserContext) {
    const effective_business_id = resolve_effective_business_id(current_user);
    const users = await this.users_repository.find_all_by_business(
      effective_business_id,
    );
    return users.map((user) => this.serialize_user(user));
  }

  async create_user(
    current_user: AuthenticatedUserContext,
    dto: CreateUserDto,
  ) {
    const effective_business_id = resolve_effective_business_id(current_user);
    const normalized_email = this.normalize_email(dto.email);

    if (await this.users_repository.exists_email(normalized_email)) {
      throw new DomainConflictException({
        code: 'USER_EMAIL_DUPLICATE',
        messageKey: 'users.email_duplicate',
        details: {
          field: 'email',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('US', dto.code);
    }

    this.assert_user_type_assignment(current_user, dto.user_type);

    const user = this.users_repository.create({
      business_id: effective_business_id,
      code: dto.code ?? null,
      name: dto.name.trim(),
      email: normalized_email,
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
      const normalized_email = this.normalize_email(dto.email);
      const duplicated = await this.users_repository.exists_email(
        normalized_email,
        user.id,
      );
      if (duplicated) {
        throw new DomainConflictException({
          code: 'USER_EMAIL_DUPLICATE',
          messageKey: 'users.email_duplicate',
          details: {
            field: 'email',
          },
        });
      }
      user.email = normalized_email;
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

  async delete_user(
    current_user: AuthenticatedUserContext,
    user_id: number,
  ): Promise<{ id: number; deleted: true }> {
    const user = await this.get_user_entity(current_user, user_id);

    if (current_user.id === user.id) {
      throw new DomainBadRequestException({
        code: 'USER_SELF_DELETE_FORBIDDEN',
        messageKey: 'users.self_delete_forbidden',
        details: {
          user_id,
        },
      });
    }

    if (user.is_platform_admin) {
      throw new DomainBadRequestException({
        code: 'USER_PLATFORM_ADMIN_DELETE_FORBIDDEN',
        messageKey: 'users.platform_admin_delete_forbidden',
        details: {
          user_id,
        },
      });
    }

    if (user.user_type === UserType.OWNER) {
      const owner_count = await this.users_repository.count_by_type_in_business(
        user.business_id,
        UserType.OWNER,
      );
      if (owner_count <= 1) {
        throw new DomainBadRequestException({
          code: 'USER_LAST_OWNER_DELETE_FORBIDDEN',
          messageKey: 'users.last_owner_delete_forbidden',
          details: {
            user_id,
          },
        });
      }
    }

    const [inventory_movement_headers, inventory_movements, serial_events] =
      await Promise.all([
        this.inventory_movement_header_repository.count({
          where: {
            business_id: user.business_id,
            performed_by_user_id: user.id,
          },
        }),
        this.inventory_movement_repository.count({
          where: {
            business_id: user.business_id,
            created_by: user.id,
          },
        }),
        this.serial_event_repository.count({
          where: {
            business_id: user.business_id,
            performed_by_user_id: user.id,
          },
        }),
      ]);

    if (
      inventory_movement_headers > 0 ||
      inventory_movements > 0 ||
      serial_events > 0
    ) {
      throw new DomainBadRequestException({
        code: 'USER_DELETE_FORBIDDEN',
        messageKey: 'users.delete_forbidden',
        details: {
          user_id,
          dependencies: {
            inventory_movement_headers,
            inventory_movements,
            serial_events,
          },
        },
      });
    }

    await this.users_repository.remove(user);
    return {
      id: user_id,
      deleted: true,
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
    const active_business_language =
      await this.resolve_active_business_language(user);
    return this.build_authenticated_context(user, active_business_language);
  }

  async get_authenticated_context(
    user_id: number,
    business_id: number,
    active_only = true,
    session_context?: SessionContextState,
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

    const active_business_language =
      await this.resolve_active_business_language(user, session_context);
    return this.build_authenticated_context(
      user,
      active_business_language,
      session_context,
    );
  }

  async find_user_for_login(email: string): Promise<User | null> {
    return this.users_repository.find_by_email_for_login(
      this.normalize_email(email),
    );
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
      resolve_effective_business_id(current_user),
    );
    if (!user) {
      throw new DomainNotFoundException({
        code: 'USER_NOT_FOUND',
        messageKey: 'users.not_found',
        details: {
          user_id,
        },
      });
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
      resolve_effective_business_id(current_user),
    );
    if (roles.length !== role_ids.length) {
      throw new DomainBadRequestException({
        code: 'USER_INVALID_ROLES_FOR_BUSINESS',
        messageKey: 'users.invalid_roles_for_business',
        details: {
          field: 'role_ids',
        },
      });
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
        resolve_effective_business_id(current_user),
      );
    if (branches.length !== branch_ids.length) {
      throw new DomainBadRequestException({
        code: 'USER_INVALID_BRANCHES_FOR_BUSINESS',
        messageKey: 'users.invalid_branches_for_business',
        details: {
          field: 'branch_ids',
        },
      });
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
      throw new DomainBadRequestException({
        code: 'USER_SYSTEM_API_FORBIDDEN',
        messageKey: 'users.system_user_api_forbidden',
      });
    }

    if (user_type === UserType.OWNER) {
      this.user_management_policy.assert_can_assign_owner_user_type(
        current_user,
      );
    }
  }

  private normalize_email(email: string): string {
    return email.trim().toLowerCase();
  }

  private async resolve_active_business_language(
    user: User,
    session_context?: SessionContextState,
  ): Promise<string | null> {
    const active_business_id = user.is_platform_admin
      ? (session_context?.acting_business_id ?? null)
      : user.business_id;

    if (active_business_id === null) {
      return null;
    }

    if (active_business_id === user.business_id) {
      return user.business?.language ?? null;
    }

    return (
      (await this.businesses_repository.find_by_id(active_business_id))
        ?.language ?? null
    );
  }

  private collect_role_keys(user: User): string[] {
    return user.user_roles
      ?.map((user_role) => user_role.role?.role_key)
      .filter(Boolean) as string[];
  }

  private collect_permissions(user: User): string[] {
    const permissions = new Set<string>();
    for (const user_role of user.user_roles ?? []) {
      for (const role_permission of user_role.role?.role_permissions ?? []) {
        if (role_permission.permission?.key) {
          permissions.add(role_permission.permission.key);
        }
      }
    }

    if (user.is_platform_admin) {
      permissions.add('auth.login');
      permissions.add('auth.refresh');
    }

    return [...permissions].sort();
  }

  private collect_branch_ids(user: User): number[] {
    return [
      ...new Set((user.user_branch_access ?? []).map((item) => item.branch_id)),
    ].sort((left, right) => left - right);
  }

  private build_authenticated_context(
    user: User,
    active_business_language: string | null,
    session_context?: SessionContextState,
  ): AuthenticatedUserContext {
    const roles = this.collect_role_keys(user);
    const permissions = this.collect_permissions(user);
    const branch_ids = this.collect_branch_ids(user);

    const is_platform_admin = user.is_platform_admin ?? false;
    const acting_business_id = is_platform_admin
      ? (session_context?.acting_business_id ?? null)
      : null;
    const acting_branch_id =
      is_platform_admin && acting_business_id !== null
        ? (session_context?.acting_branch_id ?? null)
        : null;
    const mode = !is_platform_admin
      ? AuthenticatedUserMode.TENANT
      : acting_business_id !== null
        ? AuthenticatedUserMode.TENANT_CONTEXT
        : AuthenticatedUserMode.PLATFORM;

    return {
      id: user.id,
      business_id: user.business_id,
      active_business_language,
      email: user.email,
      name: user.name,
      roles,
      permissions,
      branch_ids,
      max_sale_discount: Number(user.max_sale_discount ?? 0),
      user_type: user.user_type,
      is_platform_admin,
      acting_business_id,
      acting_branch_id,
      mode,
      session_id: session_context?.session_id ?? null,
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
      is_platform_admin: user.is_platform_admin ?? false,
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
      effective_permissions: this.collect_permissions(user),
    };
  }
}
