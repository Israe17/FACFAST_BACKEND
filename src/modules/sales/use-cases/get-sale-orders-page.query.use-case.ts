import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

export type GetSaleOrdersPageQuery = {
  current_user: AuthenticatedUserContext;
  query: PaginatedQueryDto;
};

@Injectable()
export class GetSaleOrdersPageQueryUseCase
  implements
    QueryUseCase<GetSaleOrdersPageQuery, PaginatedResponseDto<SaleOrderView>>
{
  constructor(
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetSaleOrdersPageQuery): Promise<PaginatedResponseDto<SaleOrderView>> {
    return this.sale_orders_repository.find_paginated_by_business(
      resolve_effective_business_id(current_user),
      query,
      (order) => this.sale_order_serializer.serialize(order),
      resolve_effective_branch_scope_ids(current_user),
    );
  }
}
