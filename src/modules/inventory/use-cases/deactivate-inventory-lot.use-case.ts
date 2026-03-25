import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { InventoryLotView } from '../contracts/inventory-lot.view';
import { InventoryLotAccessPolicy } from '../policies/inventory-lot-access.policy';
import { InventoryLotsRepository } from '../repositories/inventory-lots.repository';
import { InventoryLotSerializer } from '../serializers/inventory-lot.serializer';
import { InventoryValidationService } from '../services/inventory-validation.service';

export type DeactivateInventoryLotCommand = {
  current_user: AuthenticatedUserContext;
  inventory_lot_id: number;
};

@Injectable()
export class DeactivateInventoryLotUseCase
  implements CommandUseCase<DeactivateInventoryLotCommand, InventoryLotView>
{
  constructor(
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly inventory_lot_access_policy: InventoryLotAccessPolicy,
    private readonly inventory_lots_repository: InventoryLotsRepository,
    private readonly inventory_lot_serializer: InventoryLotSerializer,
  ) {}

  async execute({
    current_user,
    inventory_lot_id,
  }: DeactivateInventoryLotCommand): Promise<InventoryLotView> {
    const lot =
      await this.inventory_validation_service.get_inventory_lot_for_operation(
        current_user,
        inventory_lot_id,
      );
    this.inventory_lot_access_policy.assert_can_access_lot(current_user, lot);

    lot.is_active = false;
    const saved_lot = await this.inventory_lots_repository.save(lot);
    return this.inventory_lot_serializer.serialize(saved_lot);
  }
}
