import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { RoleView } from '../contracts/role.view';
import { RoleLifecyclePolicy } from '../policies/role-lifecycle.policy';
import { RolesRepository } from '../repositories/roles.repository';
import { RoleSerializer } from '../serializers/role.serializer';
import { RbacValidationService } from '../services/rbac-validation.service';

export type GetRolesListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetRolesListQueryUseCase
  implements QueryUseCase<GetRolesListQuery, RoleView[]>
{
  constructor(
    private readonly roles_repository: RolesRepository,
    private readonly rbac_validation_service: RbacValidationService,
    private readonly role_lifecycle_policy: RoleLifecyclePolicy,
    private readonly role_serializer: RoleSerializer,
  ) {}

  async execute({ current_user }: GetRolesListQuery): Promise<RoleView[]> {
    const roles = await this.roles_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );
    return Promise.all(
      roles.map(async (role) => {
        const dependencies =
          await this.rbac_validation_service.count_role_delete_dependencies(
            role,
          );
        return this.role_serializer.serialize(
          role,
          this.role_lifecycle_policy.build_lifecycle(role, dependencies),
        );
      }),
    );
  }
}
