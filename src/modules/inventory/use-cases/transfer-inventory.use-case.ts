import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { InventoryMovementRecordView } from '../contracts/inventory-movement.view';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { InventoryMovementHeadersRepository } from '../repositories/inventory-movement-headers.repository';
import { InventoryMovementSerializer } from '../serializers/inventory-movement.serializer';
import { InventoryTransfersService } from '../services/inventory-transfers.service';

export type TransferInventoryCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateInventoryTransferDto;
};

@Injectable()
export class TransferInventoryUseCase
  implements
    CommandUseCase<TransferInventoryCommand, InventoryMovementRecordView>
{
  constructor(
    private readonly inventory_transfers_service: InventoryTransfersService,
    private readonly inventory_movement_headers_repository: InventoryMovementHeadersRepository,
    private readonly inventory_movement_serializer: InventoryMovementSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: TransferInventoryCommand): Promise<InventoryMovementRecordView> {
    const transfer =
      await this.inventory_transfers_service.transfer_inventory(
        current_user,
        dto,
      );
    const movement_header =
      await this.inventory_movement_headers_repository.find_by_id_in_business(
        transfer.id,
        transfer.business_id,
      );
    if (!movement_header) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_MOVEMENT_NOT_FOUND',
        messageKey: 'inventory.inventory_movement_not_found',
        details: {
          inventory_movement_id: transfer.id,
        },
      });
    }

    return this.inventory_movement_serializer.serialize_record(
      movement_header,
      {
        legacy_movement_ids: transfer.legacy_movement_ids,
        transferred_serial_ids: transfer.transferred_serial_ids,
      },
    );
  }
}
