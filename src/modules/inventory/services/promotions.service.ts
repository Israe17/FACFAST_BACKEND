import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PromotionView } from '../contracts/promotion.view';
import { CreatePromotionDto } from '../dto/create-promotion.dto';
import { UpdatePromotionDto } from '../dto/update-promotion.dto';
import { CreatePromotionUseCase } from '../use-cases/create-promotion.use-case';
import {
  DeletePromotionResult,
  DeletePromotionUseCase,
} from '../use-cases/delete-promotion.use-case';
import { GetPromotionQueryUseCase } from '../use-cases/get-promotion.query.use-case';
import { GetPromotionsListQueryUseCase } from '../use-cases/get-promotions-list.query.use-case';
import { UpdatePromotionUseCase } from '../use-cases/update-promotion.use-case';

@Injectable()
export class PromotionsService {
  constructor(
    private readonly get_promotions_list_query_use_case: GetPromotionsListQueryUseCase,
    private readonly create_promotion_use_case: CreatePromotionUseCase,
    private readonly get_promotion_query_use_case: GetPromotionQueryUseCase,
    private readonly update_promotion_use_case: UpdatePromotionUseCase,
    private readonly delete_promotion_use_case: DeletePromotionUseCase,
  ) {}

  async get_promotions(
    current_user: AuthenticatedUserContext,
  ): Promise<PromotionView[]> {
    return this.get_promotions_list_query_use_case.execute({ current_user });
  }

  async create_promotion(
    current_user: AuthenticatedUserContext,
    dto: CreatePromotionDto,
  ): Promise<PromotionView> {
    return this.create_promotion_use_case.execute({ current_user, dto });
  }

  async get_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ): Promise<PromotionView> {
    return this.get_promotion_query_use_case.execute({
      current_user,
      promotion_id,
    });
  }

  async update_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
    dto: UpdatePromotionDto,
  ): Promise<PromotionView> {
    return this.update_promotion_use_case.execute({
      current_user,
      promotion_id,
      dto,
    });
  }

  async delete_promotion(
    current_user: AuthenticatedUserContext,
    promotion_id: number,
  ): Promise<DeletePromotionResult> {
    return this.delete_promotion_use_case.execute({
      current_user,
      promotion_id,
    });
  }
}
