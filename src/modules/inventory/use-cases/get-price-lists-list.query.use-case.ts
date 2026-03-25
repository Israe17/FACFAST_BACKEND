import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PriceListView } from '../contracts/price-list.view';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { PriceListSerializer } from '../serializers/price-list.serializer';

export type GetPriceListsListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetPriceListsListQueryUseCase
  implements QueryUseCase<GetPriceListsListQuery, PriceListView[]>
{
  constructor(
    private readonly price_lists_repository: PriceListsRepository,
    private readonly price_list_serializer: PriceListSerializer,
  ) {}

  async execute({
    current_user,
  }: GetPriceListsListQuery): Promise<PriceListView[]> {
    const price_lists = await this.price_lists_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );

    return price_lists.map((price_list) =>
      this.price_list_serializer.serialize(price_list),
    );
  }
}
