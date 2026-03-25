import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { RoleView } from '../contracts/role.view';
import { UpdateRoleDto } from '../dto/update-role.dto';
import { RoleLifecyclePolicy } from '../policies/role-lifecycle.policy';
import { RolesRepository } from '../repositories/roles.repository';
import { RoleSerializer } from '../serializers/role.serializer';
import { RbacValidationService } from '../services/rbac-validation.service';

export type UpdateRoleCommand = {
  current_user: AuthenticatedUserContext;
  role_id: number;
  dto: UpdateRoleDto;
};

@Injectable()
export class UpdateRoleUseCase
  implements CommandUseCase<UpdateRoleCommand, RoleView>
{
  constructor(
    private readonly rbac_validation_service: RbacValidationService,
    private readonly role_lifecycle_policy: RoleLifecyclePolicy,
    private readonly roles_repository: RolesRepository,
    private readonly role_serializer: RoleSerializer,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async execute({
    current_user,
    role_id,
    dto,
  }: UpdateRoleCommand): Promise<RoleView> {
    const role = await this.rbac_validation_service.get_role_for_access(
      current_user,
      role_id,
    );
    this.role_lifecycle_policy.assert_updatable(role);

    if (dto.role_key) {
      const role_key = dto.role_key.trim();
      if (role_key !== role.role_key) {
        await this.rbac_validation_service.assert_role_key_available(
          resolve_effective_business_id(current_user),
          role_key,
          role.id,
        );
        role.role_key = role_key;
      }
    }

    if (dto.code) {
      const code = dto.code.trim();
      this.entity_code_service.validate_code('RL', code);
      role.code = code;
    }

    if (dto.name) {
      role.name = dto.name.trim();
    }

    return this.role_serializer.serialize(await this.roles_repository.save(role));
  }
}
