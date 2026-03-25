import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { PriceListView } from '../contracts/price-list.view';
import { PriceList } from '../entities/price-list.entity';

@Injectable()
export class PriceListSerializer
  implements EntitySerializer<PriceList, PriceListView>
{
  serialize(price_list: PriceList): PriceListView {
    return {
      id: price_list.id,
      code: price_list.code,
      business_id: price_list.business_id,
      name: price_list.name,
      kind: price_list.kind,
      currency: price_list.currency,
      is_default: price_list.is_default,
      is_active: price_list.is_active,
      lifecycle: {
        can_delete: !price_list.is_default,
        can_deactivate: price_list.is_active,
        can_reactivate: !price_list.is_active,
        reasons: price_list.is_default ? ['default_price_list'] : [],
      },
      created_at: price_list.created_at,
      updated_at: price_list.updated_at,
    };
  }
}
