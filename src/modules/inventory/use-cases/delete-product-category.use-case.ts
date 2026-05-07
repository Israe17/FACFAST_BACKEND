import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductCategory } from '../entities/product-category.entity';
import { ProductCategoriesRepository } from '../repositories/product-categories.repository';
import { ProductsRepository } from '../repositories/products.repository';

export type DeleteProductCategoryCommand = {
  current_user: AuthenticatedUserContext;
  category_id: number;
};

export type DeleteProductCategoryResult = { id: number };

@Injectable()
export class DeleteProductCategoryUseCase
  implements
    CommandUseCase<DeleteProductCategoryCommand, DeleteProductCategoryResult>
{
  constructor(
    private readonly product_categories_repository: ProductCategoriesRepository,
    private readonly products_repository: ProductsRepository,
  ) {}

  async execute({
    current_user,
    category_id,
  }: DeleteProductCategoryCommand): Promise<DeleteProductCategoryResult> {
    const business_id = resolve_effective_business_id(current_user);
    const category = await this.find_or_throw(business_id, category_id);

    const children =
      await this.product_categories_repository.find_children(
        category_id,
        business_id,
      );
    if (children.length > 0) {
      throw new DomainBadRequestException({
        code: 'CATEGORY_HAS_CHILDREN',
        messageKey: 'inventory.category_has_children',
        details: { category_id, children_count: children.length },
      });
    }

    const product_count =
      await this.products_repository.count_by_category_in_business(
        business_id,
        category_id,
      );
    if (product_count > 0) {
      throw new DomainBadRequestException({
        code: 'CATEGORY_IN_USE',
        messageKey: 'inventory.category_in_use',
        details: { category_id, product_count },
      });
    }

    await this.product_categories_repository.remove(category);
    return { id: category_id };
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
