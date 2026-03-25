import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

@Injectable()
export class PromotionBranchAssignmentPolicy {
  assert_promotion_active(
    promotion: { id: number; is_active: boolean } | null | undefined,
    required: boolean,
  ): void {
    if (!required || !promotion || promotion.is_active) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'PROMOTION_INACTIVE',
      messageKey: 'inventory.promotion_inactive',
      details: {
        promotion_id: promotion.id,
      },
    });
  }

  normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
