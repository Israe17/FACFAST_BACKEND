import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { RoleView } from '../contracts/role.view';
import { CreateRoleDto } from '../dto/create-role.dto';
import { RoleLifecyclePolicy } from '../policies/role-lifecycle.policy';
import { RolesRepository } from '../repositories/roles.repository';
import { RoleSerializer } from '../serializers/role.serializer';
import { RbacValidationService } from '../services/rbac-validation.service';

export type CreateRoleCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateRoleDto;
};

@Injectable()
export class CreateRoleUseCase
  implements CommandUseCase<CreateRoleCommand, RoleView>
{
  constructor(
    private readonly roles_repository: RolesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly role_serializer: RoleSerializer,
    private readonly role_lifecycle_policy: RoleLifecyclePolicy,
    private readonly rbac_validation_service: RbacValidationService,
  ) {}

  async execute({ current_user, dto }: CreateRoleCommand): Promise<RoleView> {
    const business_id = resolve_effective_business_id(current_user);
    const role_key = dto.role_key.trim();
    await this.rbac_validation_service.assert_role_key_available(
      business_id,
      role_key,
    );

    const code = this.normalize_code(dto.code);
    if (code) {
      this.entity_code_service.validate_code('RL', code);
    }

    const role = this.roles_repository.create({
      business_id,
      code,
      name: dto.name.trim(),
      role_key,
      is_system: false,
    });

    const saved_role = await this.roles_repository.save(role);
    return this.role_serializer.serialize(
      saved_role,
      this.role_lifecycle_policy.build_lifecycle(saved_role, {
        user_assignments: 0,
      }),
    );
  }

  private normalize_code(code?: string): string | null {
    const normalized = code?.trim();
    return normalized ? normalized : null;
  }
}
