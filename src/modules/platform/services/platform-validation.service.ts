import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { DomainUnauthorizedException } from '../../common/errors/exceptions/domain-unauthorized.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { Branch } from '../../branches/entities/branch.entity';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { Business } from '../../common/entities/business.entity';
import { BusinessesRepository } from '../../businesses/repositories/businesses.repository';
import { PlatformContextPolicy } from '../policies/platform-context.policy';

@Injectable()
export class PlatformValidationService {
  constructor(
    private readonly businesses_repository: BusinessesRepository,
    private readonly branches_repository: BranchesRepository,
    private readonly platform_context_policy: PlatformContextPolicy,
  ) {}

  async get_business_or_fail(business_id: number): Promise<Business> {
    const business = await this.businesses_repository.find_by_id(business_id);
    if (!business) {
      throw new DomainNotFoundException({
        code: 'PLATFORM_BUSINESS_NOT_FOUND',
        messageKey: 'platform.business_not_found',
        details: {
          business_id,
        },
      });
    }

    return business;
  }

  async get_active_business_or_fail(business_id: number): Promise<Business> {
    const business = await this.get_business_or_fail(business_id);
    this.platform_context_policy.assert_business_can_enter_context(business);
    return business;
  }

  async get_branch_in_business_or_fail(
    business_id: number,
    branch_id: number,
  ): Promise<Branch> {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      business_id,
    );
    if (!branch) {
      throw new DomainBadRequestException({
        code: 'PLATFORM_BRANCH_CONTEXT_INVALID',
        messageKey: 'platform.branch_context_invalid',
        details: {
          business_id,
          branch_id,
        },
      });
    }

    this.platform_context_policy.assert_branch_can_enter_context(branch);
    return branch;
  }

  assert_session_id(current_user: AuthenticatedUserContext): number {
    if (!current_user.session_id) {
      throw new DomainUnauthorizedException({
        code: 'PLATFORM_SESSION_CONTEXT_UNAVAILABLE',
        messageKey: 'platform.session_context_unavailable',
      });
    }

    return current_user.session_id;
  }
}
