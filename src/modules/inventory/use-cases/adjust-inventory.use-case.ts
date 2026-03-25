import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { InventoryMovementRecordView } from '../contracts/inventory-movement.view';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { InventoryAdjustmentsService } from '../services/inventory-adjustments.service';
import { InventoryMovementSerializer } from '../serializers/inventory-movement.serializer';

export type AdjustInventoryCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateInventoryAdjustmentDto;
};

@Injectable()
export class AdjustInventoryUseCase
  implements CommandUseCase<AdjustInventoryCommand, InventoryMovementRecordView>
{
  constructor(
    private readonly inventory_adjustments_service: InventoryAdjustmentsService,
    private readonly inventory_movement_serializer: InventoryMovementSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: AdjustInventoryCommand): Promise<InventoryMovementRecordView> {
    const result = await this.inventory_adjustments_service.adjust_inventory(
      current_user,
      dto,
    );

    return this.inventory_movement_serializer.serialize_record(
      result.movement_header,
      {
        legacy_movement_ids: [result.legacy_movement.id],
        legacy_movements: [result.legacy_movement],
      },
    );
  }
}
