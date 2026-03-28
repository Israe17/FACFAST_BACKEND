import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { RoleView } from '../contracts/role.view';
import { AssignRolePermissionsDto } from '../dto/assign-role-permissions.dto';
import { RolePermission } from '../entities/role-permission.entity';
import { RoleLifecyclePolicy } from '../policies/role-lifecycle.policy';
import { RolesRepository } from '../repositories/roles.repository';
import { RoleSerializer } from '../serializers/role.serializer';
import { RbacValidationService } from '../services/rbac-validation.service';

export type AssignRolePermissionsCommand = {
  current_user: AuthenticatedUserContext;
  role_id: number;
  dto: AssignRolePermissionsDto;
};

@Injectable()
export class AssignRolePermissionsUseCase
  implements CommandUseCase<AssignRolePermissionsCommand, RoleView>
{
  constructor(
    private readonly rbac_validation_service: RbacValidationService,
    private readonly role_lifecycle_policy: RoleLifecyclePolicy,
    private readonly roles_repository: RolesRepository,
    private readonly role_serializer: RoleSerializer,
    @InjectRepository(RolePermission)
    private readonly role_permission_repository: Repository<RolePermission>,
  ) {}

  async execute({
    current_user,
    role_id,
    dto,
  }: AssignRolePermissionsCommand): Promise<RoleView> {
    const role = await this.rbac_validation_service.get_role_for_access(
      current_user,
      role_id,
    );
    this.role_lifecycle_policy.assert_permissions_assignable(role);

    const permissions =
      await this.rbac_validation_service.get_permissions_by_ids(
        dto.permission_ids,
      );

    await this.role_permission_repository.delete({
      role_id: role.id,
    });

    if (permissions.length) {
      await this.role_permission_repository.save(
        permissions.map((permission) =>
          this.role_permission_repository.create({
            role_id: role.id,
            permission_id: permission.id,
          }),
        ),
      );
    }

    const refreshed_role = await this.roles_repository.find_by_id_in_business(
      role.id,
      role.business_id,
    );
    const resolved_role = refreshed_role ?? role;
    const dependencies =
      await this.rbac_validation_service.count_role_delete_dependencies(
        resolved_role,
      );
    return this.role_serializer.serialize(
      resolved_role,
      this.role_lifecycle_policy.build_lifecycle(resolved_role, dependencies),
    );
  }
}
