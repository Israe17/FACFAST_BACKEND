import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductCategoryView } from '../contracts/product-category.view';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductCategorySerializer } from '../serializers/product-category.serializer';

export type GetProductCategoriesQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetProductCategoriesQueryUseCase
  implements QueryUseCase<GetProductCategoriesQuery, ProductCategoryView[]>
{
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly product_category_serializer: ProductCategorySerializer,
  ) {}

  async execute({
    current_user,
  }: GetProductCategoriesQuery): Promise<ProductCategoryView[]> {
    const business_id = resolve_effective_business_id(current_user);
    const categories =
      await this.product_categories_repository.find_all_by_business(
        business_id,
      );
    return categories.map((category) =>
      this.product_category_serializer.serialize(category),
    );
  }
}
