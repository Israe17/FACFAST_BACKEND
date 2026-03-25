import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryMovementRecordView } from '../contracts/inventory-movement.view';
import { InventoryMovementAccessPolicy } from '../policies/inventory-movement-access.policy';
import { InventoryMovementHeadersRepository } from '../repositories/inventory-movement-headers.repository';
import { InventoryMovementSerializer } from '../serializers/inventory-movement.serializer';

export type GetInventoryMovementQuery = {
  current_user: AuthenticatedUserContext;
  inventory_movement_id: number;
};

@Injectable()
export class GetInventoryMovementQueryUseCase
  implements QueryUseCase<GetInventoryMovementQuery, InventoryMovementRecordView>
{
  constructor(
    private readonly inventory_movement_headers_repository: InventoryMovementHeadersRepository,
    private readonly inventory_movement_access_policy: InventoryMovementAccessPolicy,
    private readonly inventory_movement_serializer: InventoryMovementSerializer,
  ) {}

  async execute({
    current_user,
    inventory_movement_id,
  }: GetInventoryMovementQuery): Promise<InventoryMovementRecordView> {
    const movement_header =
      await this.inventory_movement_headers_repository.find_by_id_in_business(
        inventory_movement_id,
        resolve_effective_business_id(current_user),
      );
    if (!movement_header) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_MOVEMENT_NOT_FOUND',
        messageKey: 'inventory.inventory_movement_not_found',
        details: {
          inventory_movement_id,
        },
      });
    }

    this.inventory_movement_access_policy.assert_can_access_header(
      current_user,
      movement_header,
    );
    return this.inventory_movement_serializer.serialize(movement_header);
  }
}
