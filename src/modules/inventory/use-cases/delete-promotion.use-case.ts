import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { PromotionsRepository } from '../repositories/promotions.repository';
import { PricingValidationService } from '../services/pricing-validation.service';

export type DeletePromotionCommand = {
  current_user: AuthenticatedUserContext;
  promotion_id: number;
};

export type DeletePromotionResult = {
  id: number;
};

@Injectable()
export class DeletePromotionUseCase
  implements CommandUseCase<DeletePromotionCommand, DeletePromotionResult>
{
  constructor(
    private readonly pricing_validation_service: PricingValidationService,
    private readonly promotions_repository: PromotionsRepository,
  ) {}

  async execute({
    current_user,
    promotion_id,
  }: DeletePromotionCommand): Promise<DeletePromotionResult> {
    const promotion =
      await this.pricing_validation_service.get_promotion_in_business(
        resolve_effective_business_id(current_user),
        promotion_id,
      );
    await this.promotions_repository.remove(promotion);
    return { id: promotion_id };
  }
}
