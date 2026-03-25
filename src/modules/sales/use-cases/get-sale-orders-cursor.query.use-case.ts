import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

export type GetSaleOrdersCursorQuery = {
  current_user: AuthenticatedUserContext;
  query: CursorQueryDto;
};

@Injectable()
export class GetSaleOrdersCursorQueryUseCase
  implements
    QueryUseCase<GetSaleOrdersCursorQuery, CursorResponseDto<SaleOrderView>>
{
  constructor(
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetSaleOrdersCursorQuery): Promise<CursorResponseDto<SaleOrderView>> {
    return this.sale_orders_repository.find_cursor_by_business(
      resolve_effective_business_id(current_user),
      query,
      (order) => this.sale_order_serializer.serialize(order),
      resolve_effective_branch_scope_ids(current_user),
    );
  }
}
