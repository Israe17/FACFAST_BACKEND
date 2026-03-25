import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

@Injectable()
export class PriceListBranchAssignmentPolicy {
  assert_default_requires_active(
    is_default: boolean,
    is_active: boolean,
  ): void {
    if (is_default && !is_active) {
      throw new DomainBadRequestException({
        code: 'BRANCH_PRICE_LIST_DEFAULT_REQUIRES_ACTIVE_ASSIGNMENT',
        messageKey:
          'inventory.branch_price_list_default_requires_active_assignment',
      });
    }
  }

  assert_price_list_active(
    price_list: { id: number; is_active: boolean } | null | undefined,
    required: boolean,
  ): void {
    if (!required || !price_list || price_list.is_active) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'PRICE_LIST_INACTIVE',
      messageKey: 'inventory.price_list_inactive',
      details: {
        price_list_id: price_list.id,
      },
    });
  }

  normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
