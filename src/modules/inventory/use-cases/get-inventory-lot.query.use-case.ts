import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { InventoryLotAccessPolicy } from '../policies/inventory-lot-access.policy';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryLotSerializer } from '../serializers/inventory-lot.serializer';

export type GetInventoryLotQuery = {
  current_user: AuthenticatedUserContext;
  inventory_lot_id: number;
};

@Injectable()
export class GetInventoryLotQueryUseCase
  implements QueryUseCase<GetInventoryLotQuery, InventoryLotView>
{
  constructor(
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_lot_access_policy: InventoryLotAccessPolicy,
    private readonly inventory_lot_serializer: InventoryLotSerializer,
  ) {}

  async execute({
    current_user,
    inventory_lot_id,
  }: GetInventoryLotQuery): Promise<InventoryLotView> {
    const lot = await this.inventory_lots_repository.find_by_id_in_business(
      inventory_lot_id,
      resolve_effective_business_id(current_user),
    );
    if (!lot) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_LOT_NOT_FOUND',
        messageKey: 'inventory.inventory_lot_not_found',
        details: {
          inventory_lot_id,
        },
      });
    }

    this.inventory_lot_access_policy.assert_can_access_lot(current_user, lot);
    return this.inventory_lot_serializer.serialize(lot);
  }
}
