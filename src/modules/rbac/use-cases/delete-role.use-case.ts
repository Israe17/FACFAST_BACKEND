import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { RoleLifecyclePolicy } from '../policies/role-lifecycle.policy';
import { RolesRepository } from '../repositories/roles.repository';
import { RbacValidationService } from '../services/rbac-validation.service';

export type DeleteRoleCommand = {
  current_user: AuthenticatedUserContext;
  role_id: number;
};

export type DeleteRoleResult = {
  id: number;
  deleted: true;
  success: true;
};

@Injectable()
export class DeleteRoleUseCase
  implements CommandUseCase<DeleteRoleCommand, DeleteRoleResult>
{
  constructor(
    private readonly rbac_validation_service: RbacValidationService,
    private readonly role_lifecycle_policy: RoleLifecyclePolicy,
    private readonly roles_repository: RolesRepository,
  ) {}

  async execute({
    current_user,
    role_id,
  }: DeleteRoleCommand): Promise<DeleteRoleResult> {
    const role = await this.rbac_validation_service.get_role_for_access(
      current_user,
      role_id,
    );
    const dependencies =
      await this.rbac_validation_service.count_role_delete_dependencies(role);

    this.role_lifecycle_policy.assert_deletable(role, dependencies);
    await this.roles_repository.delete(role);

    return {
      id: role_id,
      deleted: true,
      success: true,
    };
  }
}
