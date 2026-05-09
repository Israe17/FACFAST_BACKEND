import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { ListDispatchOrdersQueryDto } from '../dto/list-dispatch-orders-query.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { DispatchOrderView } from '../contracts/dispatch-order.view';
import { DispatchOrdersRepository } from '../repositories/dispatch-orders.repository';
import { DispatchOrderSerializer } from '../serializers/dispatch-order.serializer';

export type GetDispatchOrdersCursorQuery = {
  current_user: AuthenticatedUserContext;
  query: ListDispatchOrdersQueryDto;
};

@Injectable()
export class GetDispatchOrdersCursorQueryUseCase
  implements
    QueryUseCase<
      GetDispatchOrdersCursorQuery,
      CursorResponseDto<DispatchOrderView>
    >
{
  constructor(
    private readonly dispatch_orders_repository: DispatchOrdersRepository,
    private readonly dispatch_order_serializer: DispatchOrderSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetDispatchOrdersCursorQuery): Promise<
    CursorResponseDto<DispatchOrderView>
  > {
    return this.dispatch_orders_repository.find_cursor_by_business_in_scope(
      resolve_effective_business_id(current_user),
      resolve_effective_branch_scope_ids(current_user),
      query,
      (order) => this.dispatch_order_serializer.serialize(order),
      {
        created_by_user_id: query.created_by_user_id,
        branch_id: query.branch_id,
        from: query.from,
        to: query.to,
        status: query.status,
        dispatch_type: query.dispatch_type,
        vehicle_id: query.vehicle_id,
        driver_user_id: query.driver_user_id,
        route_id: query.route_id,
      },
    );
  }
}
