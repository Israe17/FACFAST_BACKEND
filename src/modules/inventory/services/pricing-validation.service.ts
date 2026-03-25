import { Injectable } from '@nestjs/common';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { Branch } from '../../branches/entities/branch.entity';
import { BranchesRepository } from '../../branches/repositories/branches.repository';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PriceListBranchAssignment } from '../entities/price-list-branch-assignment.entity';
import { PriceList } from '../entities/price-list.entity';
import { ProductPrice } from '../entities/product-price.entity';
import { PromotionBranchAssignment } from '../entities/promotion-branch-assignment.entity';
import { Promotion } from '../entities/promotion.entity';
import { PriceListBranchAssignmentsRepository } from '../repositories/price-list-branch-assignments.repository';
import { PriceListsRepository } from '../repositories/price-lists.repository';
import { ProductPricesRepository } from '../repositories/product-prices.repository';
import { PromotionBranchAssignmentsRepository } from '../repositories/promotion-branch-assignments.repository';
import { PromotionsRepository } from '../repositories/promotions.repository';

@Injectable()
export class PricingValidationService {
  constructor(
    private readonly branches_repository: BranchesRepository,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly price_lists_repository: PriceListsRepository,
    private readonly product_prices_repository: ProductPricesRepository,
    private readonly promotions_repository: PromotionsRepository,
    private readonly price_list_branch_assignments_repository: PriceListBranchAssignmentsRepository,
    private readonly promotion_branch_assignments_repository: PromotionBranchAssignmentsRepository,
  ) {}

  async get_branch_for_pricing_access(
    current_user: AuthenticatedUserContext,
    business_id: number,
    branch_id: number,
  ): Promise<Branch> {
    const branch = await this.branches_repository.find_by_id_in_business(
      branch_id,
      business_id,
    );
    if (!branch) {
      throw new DomainNotFoundException({
        code: 'BRANCH_NOT_FOUND',
        messageKey: 'branches.not_found',
        details: {
          branch_id,
        },
      });
    }

    this.branch_access_policy.assert_can_access_branch(current_user, branch.id);
    return branch;
  }

  async get_price_list_in_business(
    business_id: number,
    price_list_id: number,
  ): Promise<PriceList> {
    const price_list = await this.price_lists_repository.find_by_id_in_business(
      price_list_id,
      business_id,
    );
    if (!price_list) {
      throw new DomainNotFoundException({
        code: 'PRICE_LIST_NOT_FOUND',
        messageKey: 'inventory.price_list_not_found',
        details: {
          price_list_id,
        },
      });
    }

    return price_list;
  }

  async get_product_price_in_business(
    business_id: number,
    product_price_id: number,
  ): Promise<ProductPrice> {
    const product_price =
      await this.product_prices_repository.find_by_id_in_business(
        product_price_id,
        business_id,
      );
    if (!product_price) {
      throw new DomainNotFoundException({
        code: 'PRODUCT_PRICE_NOT_FOUND',
        messageKey: 'inventory.product_price_not_found',
        details: {
          product_price_id,
        },
      });
    }

    return product_price;
  }

  async get_promotion_in_business(
    business_id: number,
    promotion_id: number,
  ): Promise<Promotion> {
    const promotion = await this.promotions_repository.find_by_id_in_business(
      promotion_id,
      business_id,
    );
    if (!promotion) {
      throw new DomainNotFoundException({
        code: 'PROMOTION_NOT_FOUND',
        messageKey: 'inventory.promotion_not_found',
        details: {
          promotion_id,
        },
      });
    }

    return promotion;
  }

  async get_price_list_branch_assignment_in_business(
    business_id: number,
    assignment_id: number,
  ): Promise<PriceListBranchAssignment> {
    const assignment =
      await this.price_list_branch_assignments_repository.find_by_id_in_business(
        assignment_id,
        business_id,
      );
    if (!assignment) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_price_list_assignment_not_found',
        details: {
          assignment_id,
        },
      });
    }

    return assignment;
  }

  async get_promotion_branch_assignment_in_business(
    business_id: number,
    assignment_id: number,
  ): Promise<PromotionBranchAssignment> {
    const assignment =
      await this.promotion_branch_assignments_repository.find_by_id_in_business(
        assignment_id,
        business_id,
      );
    if (!assignment) {
      throw new DomainNotFoundException({
        code: 'BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND',
        messageKey: 'inventory.branch_promotion_assignment_not_found',
        details: {
          assignment_id,
        },
      });
    }

    return assignment;
  }
}
