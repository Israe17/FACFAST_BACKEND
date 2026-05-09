import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryMovementRecordView } from '../contracts/inventory-movement.view';
import { ListInventoryMovementsQueryDto } from '../dto/list-inventory-movements-query.dto';
import { InventoryMovementHeadersRepository } from '../repositories/inventory-movement-headers.repository';
import { InventoryMovementSerializer } from '../serializers/inventory-movement.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type GetInventoryMovementsCursorQuery = {
  current_user: AuthenticatedUserContext;
  query: ListInventoryMovementsQueryDto;
};

@Injectable()
export class GetInventoryMovementsCursorQueryUseCase
  implements
    QueryUseCase<
      GetInventoryMovementsCursorQuery,
      CursorResponseDto<InventoryMovementRecordView>
    >
{
  constructor(
    private readonly inventory_movement_headers_repository: InventoryMovementHeadersRepository,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_movement_serializer: InventoryMovementSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetInventoryMovementsCursorQuery): Promise<
    CursorResponseDto<InventoryMovementRecordView>
  > {
    return this.inventory_movement_headers_repository.find_cursor_by_business(
      resolve_effective_business_id(current_user),
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      ),
      query,
      (header) => this.inventory_movement_serializer.serialize(header),
      {
        warehouse_id: query.warehouse_id,
        product_variant_id: query.product_variant_id,
        product_id: query.product_id,
        performed_by_user_id: query.performed_by_user_id,
      },
    );
  }
}
