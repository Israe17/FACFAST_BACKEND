import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionView } from '../contracts/promotion.view';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { PromotionSerializer } from '../serializers/promotion.serializer';

export type GetPromotionsListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetPromotionsListQueryUseCase
  implements QueryUseCase<GetPromotionsListQuery, PromotionView[]>
{
  constructor(
    private readonly promotions_repository: PromotionsRepository,
    private readonly promotion_serializer: PromotionSerializer,
  ) {}

  async execute({
    current_user,
  }: GetPromotionsListQuery): Promise<PromotionView[]> {
    const promotions = await this.promotions_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );

    return promotions.map((promotion) =>
      this.promotion_serializer.serialize(promotion),
    );
  }
}
