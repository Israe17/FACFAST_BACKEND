import { Injectable } from '@nestjs/common';
import { TransitionPolicy } from '../../common/application/interfaces/transition-policy.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

@Injectable()
export class PriceListLifecyclePolicy
  implements TransitionPolicy<{ id: number; is_default: boolean }, 'delete'>
{
  assert_transition_allowed(
    price_list: { id: number; is_default: boolean },
    transition: 'delete',
  ): void {
    if (transition !== 'delete') {
      return;
    }

    if (price_list.is_default) {
      throw new DomainBadRequestException({
        code: 'CANNOT_DELETE_DEFAULT_PRICE_LIST',
        messageKey: 'inventory.cannot_delete_default_price_list',
        details: {
          price_list_id: price_list.id,
        },
      });
    }
  }

  assert_deletable(price_list: { id: number; is_default: boolean }): void {
    this.assert_transition_allowed(price_list, 'delete');
  }
}
