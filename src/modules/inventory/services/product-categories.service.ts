import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { CreateProductCategoryDto } from '../dto/create-product-category.dto';
import { UpdateProductCategoryDto } from '../dto/update-product-category.dto';
import { CreateProductCategoryUseCase } from '../use-cases/create-product-category.use-case';
import { DeleteProductCategoryUseCase } from '../use-cases/delete-product-category.use-case';
import { GetProductCategoriesQueryUseCase } from '../use-cases/get-product-categories.query.use-case';
import { GetProductCategoryQueryUseCase } from '../use-cases/get-product-category.query.use-case';
import { GetProductCategoryTreeQueryUseCase } from '../use-cases/get-product-category-tree.query.use-case';
import { UpdateProductCategoryUseCase } from '../use-cases/update-product-category.use-case';

@Injectable()
export class ProductCategoriesService {
  constructor(
    private readonly get_product_categories_query_use_case: GetProductCategoriesQueryUseCase,
    private readonly get_product_category_query_use_case: GetProductCategoryQueryUseCase,
    private readonly get_product_category_tree_query_use_case: GetProductCategoryTreeQueryUseCase,
    private readonly create_product_category_use_case: CreateProductCategoryUseCase,
    private readonly update_product_category_use_case: UpdateProductCategoryUseCase,
    private readonly delete_product_category_use_case: DeleteProductCategoryUseCase,
  ) {}

  get_categories(current_user: AuthenticatedUserContext) {
    return this.get_product_categories_query_use_case.execute({ current_user });
  }

  get_tree(current_user: AuthenticatedUserContext) {
    return this.get_product_category_tree_query_use_case.execute({
      current_user,
    });
  }

  get_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
  ) {
    return this.get_product_category_query_use_case.execute({
      current_user,
      category_id,
    });
  }

  create_category(
    current_user: AuthenticatedUserContext,
    dto: CreateProductCategoryDto,
  ) {
    return this.create_product_category_use_case.execute({ current_user, dto });
  }

  update_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
    dto: UpdateProductCategoryDto,
  ) {
    return this.update_product_category_use_case.execute({
      current_user,
      category_id,
      dto,
    });
  }

  delete_category(
    current_user: AuthenticatedUserContext,
    category_id: number,
  ) {
    return this.delete_product_category_use_case.execute({
      current_user,
      category_id,
    });
  }
}
