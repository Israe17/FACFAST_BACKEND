import { Injectable } from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PriceListView } from '../contracts/price-list.view';
import { ProductPriceView } from '../contracts/product-price.view';
import { CreatePriceListDto } from '../dto/create-price-list.dto';
import { CreateProductPriceDto } from '../dto/create-product-price.dto';
import { UpdatePriceListDto } from '../dto/update-price-list.dto';
import { UpdateProductPriceDto } from '../dto/update-product-price.dto';
import { CreatePriceListUseCase } from '../use-cases/create-price-list.use-case';
import { CreateProductPriceUseCase } from '../use-cases/create-product-price.use-case';
import {
  DeletePriceListResult,
  DeletePriceListUseCase,
} from '../use-cases/delete-price-list.use-case';
import {
  DeleteProductPriceResult,
  DeleteProductPriceUseCase,
} from '../use-cases/delete-product-price.use-case';
import { GetPriceListQueryUseCase } from '../use-cases/get-price-list.query.use-case';
import { GetPriceListsListQueryUseCase } from '../use-cases/get-price-lists-list.query.use-case';
import { GetProductPriceQueryUseCase } from '../use-cases/get-product-price.query.use-case';
import { GetProductPricesQueryUseCase } from '../use-cases/get-product-prices.query.use-case';
import { UpdatePriceListUseCase } from '../use-cases/update-price-list.use-case';
import { UpdateProductPriceUseCase } from '../use-cases/update-product-price.use-case';

@Injectable()
export class PricingService {
  constructor(
    private readonly get_price_lists_list_query_use_case: GetPriceListsListQueryUseCase,
    private readonly create_price_list_use_case: CreatePriceListUseCase,
    private readonly get_price_list_query_use_case: GetPriceListQueryUseCase,
    private readonly update_price_list_use_case: UpdatePriceListUseCase,
    private readonly delete_price_list_use_case: DeletePriceListUseCase,
    private readonly get_product_prices_query_use_case: GetProductPricesQueryUseCase,
    private readonly create_product_price_use_case: CreateProductPriceUseCase,
    private readonly get_product_price_query_use_case: GetProductPriceQueryUseCase,
    private readonly update_product_price_use_case: UpdateProductPriceUseCase,
    private readonly delete_product_price_use_case: DeleteProductPriceUseCase,
  ) {}

  async get_price_lists(
    current_user: AuthenticatedUserContext,
  ): Promise<PriceListView[]> {
    return this.get_price_lists_list_query_use_case.execute({ current_user });
  }

  async create_price_list(
    current_user: AuthenticatedUserContext,
    dto: CreatePriceListDto,
  ): Promise<PriceListView> {
    return this.create_price_list_use_case.execute({ current_user, dto });
  }

  async get_price_list(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
  ): Promise<PriceListView> {
    return this.get_price_list_query_use_case.execute({
      current_user,
      price_list_id,
    });
  }

  async update_price_list(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
    dto: UpdatePriceListDto,
  ): Promise<PriceListView> {
    return this.update_price_list_use_case.execute({
      current_user,
      price_list_id,
      dto,
    });
  }

  async delete_price_list(
    current_user: AuthenticatedUserContext,
    price_list_id: number,
  ): Promise<DeletePriceListResult> {
    return this.delete_price_list_use_case.execute({
      current_user,
      price_list_id,
    });
  }

  async get_product_prices(
    current_user: AuthenticatedUserContext,
    product_id: number,
  ): Promise<ProductPriceView[]> {
    return this.get_product_prices_query_use_case.execute({
      current_user,
      product_id,
    });
  }

  async create_product_price(
    current_user: AuthenticatedUserContext,
    product_id: number,
    dto: CreateProductPriceDto,
  ): Promise<ProductPriceView> {
    return this.create_product_price_use_case.execute({
      current_user,
      product_id,
      dto,
    });
  }

  async get_product_price(
    current_user: AuthenticatedUserContext,
    product_price_id: number,
  ): Promise<ProductPriceView> {
    return this.get_product_price_query_use_case.execute({
      current_user,
      product_price_id,
    });
  }

  async update_product_price(
    current_user: AuthenticatedUserContext,
    product_price_id: number,
    dto: UpdateProductPriceDto,
  ): Promise<ProductPriceView> {
    return this.update_product_price_use_case.execute({
      current_user,
      product_price_id,
      dto,
    });
  }

  async delete_product_price(
    current_user: AuthenticatedUserContext,
    product_price_id: number,
  ): Promise<DeleteProductPriceResult> {
    return this.delete_product_price_use_case.execute({
      current_user,
      product_price_id,
    });
  }
}
