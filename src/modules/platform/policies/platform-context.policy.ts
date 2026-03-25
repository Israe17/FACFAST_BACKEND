import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

@Injectable()
export class PlatformContextPolicy {
  assert_business_can_enter_context(business: {
    id: number;
    is_active: boolean;
  }): void {
    if (!business.is_active) {
      throw new DomainBadRequestException({
        code: 'PLATFORM_BUSINESS_INACTIVE',
        messageKey: 'platform.business_inactive',
        details: {
          business_id: business.id,
        },
      });
    }
  }

  assert_branch_can_enter_context(branch: {
    id: number;
    is_active: boolean;
  }): void {
    if (!branch.is_active) {
      throw new DomainBadRequestException({
        code: 'PLATFORM_BRANCH_INACTIVE',
        messageKey: 'platform.branch_inactive',
        details: {
          branch_id: branch.id,
        },
      });
    }
  }
}
