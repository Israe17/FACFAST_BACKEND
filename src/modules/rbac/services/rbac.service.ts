import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { RoleView } from '../contracts/role.view';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { CreateRoleDto } from '../dto/create-role.dto';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { AssignRolePermissionsUseCase } from '../use-cases/assign-role-permissions.use-case';
import { CreateRoleUseCase } from '../use-cases/create-role.use-case';
import {
  DeleteRoleResult,
  DeleteRoleUseCase,
} from '../use-cases/delete-role.use-case';
import { GetRolesListQueryUseCase } from '../use-cases/get-roles-list.query.use-case';
import { UpdateRoleUseCase } from '../use-cases/update-role.use-case';

@Injectable()
export class RbacService {
  constructor(
    private readonly get_roles_list_query_use_case: GetRolesListQueryUseCase,
    private readonly create_role_use_case: CreateRoleUseCase,
    private readonly update_role_use_case: UpdateRoleUseCase,
    private readonly delete_role_use_case: DeleteRoleUseCase,
    private readonly assign_role_permissions_use_case: AssignRolePermissionsUseCase,
  ) {}

  async get_roles(
    current_user: AuthenticatedUserContext,
  ): Promise<RoleView[]> {
    return this.get_roles_list_query_use_case.execute({ current_user });
  }

  async create_role(
    current_user: AuthenticatedUserContext,
    dto: CreateRoleDto,
  ): Promise<RoleView> {
    return this.create_role_use_case.execute({ current_user, dto });
  }

  async update_role(
    current_user: AuthenticatedUserContext,
    role_id: number,
    dto: UpdateRoleDto,
  ): Promise<RoleView> {
    return this.update_role_use_case.execute({ current_user, role_id, dto });
  }

  async delete_role(
    current_user: AuthenticatedUserContext,
    role_id: number,
  ): Promise<DeleteRoleResult> {
    return this.delete_role_use_case.execute({ current_user, role_id });
  }

  async assign_permissions(
    current_user: AuthenticatedUserContext,
    role_id: number,
    dto: AssignRolePermissionsDto,
  ): Promise<RoleView> {
    return this.assign_role_permissions_use_case.execute({
      current_user,
      role_id,
      dto,
    });
  }
}
