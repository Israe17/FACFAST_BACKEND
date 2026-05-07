import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductCategoryView } from '../contracts/product-category.view';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductCategorySerializer } from '../serializers/product-category.serializer';

export type GetProductCategoryQuery = {
  current_user: AuthenticatedUserContext;
  category_id: number;
};

@Injectable()
export class GetProductCategoryQueryUseCase
  implements QueryUseCase<GetProductCategoryQuery, ProductCategoryView>
{
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly product_category_serializer: ProductCategorySerializer,
  ) {}

  async execute({
    current_user,
    category_id,
  }: GetProductCategoryQuery): Promise<ProductCategoryView> {
    const business_id = resolve_effective_business_id(current_user);
    const category = await this.find_or_throw(business_id, category_id);
    return this.product_category_serializer.serialize(category);
  }

  private async find_or_throw(
    business_id: number,
    category_id: number,
  ): Promise<ProductCategory> {
    const category =
      await this.product_categories_repository.find_by_id_in_business(
        category_id,
        business_id,
      );
    if (!category) {
      throw new DomainNotFoundException({
        code: 'CATEGORY_NOT_FOUND',
        messageKey: 'inventory.category_not_found',
        details: { category_id },
      });
    }
    return category;
  }
}
