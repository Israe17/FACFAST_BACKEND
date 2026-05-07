import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductCategoryTreeNode } from '../contracts/product-category.view';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductCategorySerializer } from '../serializers/product-category.serializer';

export type GetProductCategoryTreeQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetProductCategoryTreeQueryUseCase
  implements
    QueryUseCase<GetProductCategoryTreeQuery, ProductCategoryTreeNode[]>
{
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly product_category_serializer: ProductCategorySerializer,
  ) {}

  async execute({
    current_user,
  }: GetProductCategoryTreeQuery): Promise<ProductCategoryTreeNode[]> {
    const business_id = resolve_effective_business_id(current_user);
    const categories =
      await this.product_categories_repository.find_all_by_business(
        business_id,
      );
    const nodes = new Map<number, ProductCategoryTreeNode>(
      categories.map((category) => [
        category.id,
        {
          ...this.product_category_serializer.serialize(category),
          children: [],
        },
      ]),
    );

    const roots: ProductCategoryTreeNode[] = [];
    for (const category of categories) {
      const node = nodes.get(category.id)!;
      if (category.parent_id && nodes.has(category.parent_id)) {
        nodes.get(category.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    }
    return roots;
  }
}
