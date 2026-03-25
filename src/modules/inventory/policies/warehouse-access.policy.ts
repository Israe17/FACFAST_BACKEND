import { Injectable } from '@nestjs/common';
import { AccessPolicy } from '../../common/application/interfaces/access-policy.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';

type WarehouseScopedSubject = {
  branch_id: number;
  branch_links?: Array<{
    branch_id: number;
    is_active: boolean;
  }>;
};

@Injectable()
export class WarehouseAccessPolicy
  implements AccessPolicy<{ branch_id: number }>
{
  constructor(private readonly branch_access_policy: BranchAccessPolicy) {}

  assert_can_access(
    current_user: AuthenticatedUserContext,
    subject: { branch_id: number },
  ): void {
    this.branch_access_policy.assert_can_access_branch(
      current_user,
      subject.branch_id,
    );
  }

  assert_can_access_branch_id(
    current_user: AuthenticatedUserContext,
    branch_id: number,
  ): void {
    this.assert_can_access(current_user, { branch_id });
  }

  assert_can_access_warehouse(
    current_user: AuthenticatedUserContext,
    warehouse: WarehouseScopedSubject,
  ): void {
    const accessible_branch_ids = [
      warehouse.branch_id,
      ...(warehouse.branch_links
        ?.filter((branch_link) => branch_link.is_active)
        .map((branch_link) => branch_link.branch_id) ?? []),
    ];
    this.branch_access_policy.assert_can_access_any_branch(
      current_user,
      Array.from(new Set(accessible_branch_ids)),
    );
  }

  assert_can_access_location(
    current_user: AuthenticatedUserContext,
    location: { branch_id: number },
  ): void {
    this.assert_can_access(current_user, location);
  }
}
