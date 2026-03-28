import { Injectable } from '@nestjs/common';
import { TransitionPolicy } from '../../common/application/interfaces/transition-policy.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

export type RoleLifecycleTransition =
  | 'update'
  | 'delete'
  | 'assign_permissions';

type RoleDeleteDependencies = {
  user_assignments: number;
};

@Injectable()
export class RoleLifecyclePolicy
  implements
    TransitionPolicy<{ id: number; is_system: boolean }, RoleLifecycleTransition>
{
  build_lifecycle(
    role: { is_system: boolean },
    dependencies?: RoleDeleteDependencies,
  ) {
    let can_delete = false;
    let reasons: string[] = [];

    if (role.is_system) {
      reasons = ['system_role'];
    } else if (dependencies === undefined) {
      reasons = ['delete_requires_dependency_check'];
    } else if (dependencies.user_assignments > 0) {
      reasons = ['in_use'];
    } else {
      can_delete = true;
    }

    return {
      can_update: true,
      can_delete,
      can_assign_permissions: true,
      reasons,
    };
  }

  assert_transition_allowed(
    role: { id: number; is_system: boolean },
    transition: RoleLifecycleTransition,
  ): void {
    if (transition !== 'delete') {
      return;
    }

    if (role.is_system) {
      throw new DomainBadRequestException({
        code: 'ROLE_SYSTEM_DELETE_FORBIDDEN',
        messageKey: 'rbac.system_role_delete_forbidden',
        details: {
          role_id: role.id,
        },
      });
    }
  }

  assert_updatable(role: { id: number; is_system: boolean }): void {
    this.assert_transition_allowed(role, 'update');
  }

  assert_permissions_assignable(role: {
    id: number;
    is_system: boolean;
  }): void {
    this.assert_transition_allowed(role, 'assign_permissions');
  }

  assert_deletable(
    role: { id: number; is_system: boolean },
    dependencies: RoleDeleteDependencies,
  ): void {
    this.assert_transition_allowed(role, 'delete');

    if (dependencies.user_assignments > 0) {
      throw new DomainBadRequestException({
        code: 'ROLE_IN_USE_DELETE_FORBIDDEN',
        messageKey: 'rbac.role_in_use_delete_forbidden',
        details: {
          role_id: role.id,
          dependencies,
        },
      });
    }
  }
}
