import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

@Injectable()
export class ProductPricePolicy {
  assert_valid_date_range(
    valid_from?: string | Date | null,
    valid_to?: string | Date | null,
  ): void {
    const from = valid_from
      ? valid_from instanceof Date
        ? valid_from
        : new Date(valid_from)
      : null;
    const to = valid_to
      ? valid_to instanceof Date
        ? valid_to
        : new Date(valid_to)
      : null;

    if (from && to && to < from) {
      throw new DomainBadRequestException({
        code: 'PRICE_VALID_RANGE_INVALID',
        messageKey: 'inventory.price_valid_range_invalid',
        details: {
          field: 'valid_to',
        },
      });
    }
  }
}
