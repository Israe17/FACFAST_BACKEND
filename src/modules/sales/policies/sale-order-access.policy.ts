import { Injectable } from '@nestjs/common';
import { AccessPolicy } from '../../common/application/interfaces/access-policy.interface';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';

@Injectable()
export class SaleOrderAccessPolicy
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

  assert_can_access_order(
    current_user: AuthenticatedUserContext,
    order: { branch_id: number },
  ): void {
    this.assert_can_access(current_user, order);
  }
}
