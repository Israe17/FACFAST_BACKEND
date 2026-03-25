import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryLotSerializer } from '../serializers/inventory-lot.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type GetInventoryLotsPageQuery = {
  current_user: AuthenticatedUserContext;
  query: PaginatedQueryDto;
};

@Injectable()
export class GetInventoryLotsPageQueryUseCase
  implements
    QueryUseCase<
      GetInventoryLotsPageQuery,
      PaginatedResponseDto<InventoryLotView>
    >
{
  constructor(
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_lot_serializer: InventoryLotSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetInventoryLotsPageQuery): Promise<PaginatedResponseDto<InventoryLotView>> {
    return this.inventory_lots_repository.find_paginated_by_business(
      resolve_effective_business_id(current_user),
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
      query,
      (lot) => this.inventory_lot_serializer.serialize(lot),
    );
  }
}
