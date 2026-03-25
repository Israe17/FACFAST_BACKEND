import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionView } from '../contracts/promotion.view';
import { PromotionSerializer } from '../serializers/promotion.serializer';
import { PricingValidationService } from '../services/pricing-validation.service';

export type GetPromotionQuery = {
  current_user: AuthenticatedUserContext;
  promotion_id: number;
};

@Injectable()
export class GetPromotionQueryUseCase
  implements QueryUseCase<GetPromotionQuery, PromotionView>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotion_serializer: PromotionSerializer,
  ) {}

  async execute({
    current_user,
    promotion_id,
  }: GetPromotionQuery): Promise<PromotionView> {
    const promotion =
      await this.pricing_validation_service.get_promotion_in_business(
        resolve_effective_business_id(current_user),
        promotion_id,
      );

    return this.promotion_serializer.serialize(promotion);
  }
}
