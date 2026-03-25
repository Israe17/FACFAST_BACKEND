import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import {
  CancelInventoryMovementResultView,
} from '../contracts/inventory-movement.view';
import { CancelInventoryMovementDto } from '../dto/cancel-inventory-movement.dto';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovementHeader } from '../entities/inventory-movement-header.entity';
import { InventoryMovementLine } from '../entities/inventory-movement-line.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { ProductSerial } from '../entities/product-serial.entity';
import { SerialEvent } from '../entities/serial-event.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { SerialEventType } from '../enums/serial-event-type.enum';
import { InventoryMovementAccessPolicy } from '../policies/inventory-movement-access.policy';
import { InventoryMovementLifecyclePolicy } from '../policies/inventory-movement-lifecycle.policy';
import { InventoryMovementHeadersRepository } from '../repositories/inventory-movement-headers.repository';
import { InventoryMovementSerializer } from '../serializers/inventory-movement.serializer';
import { InventoryLedgerService } from '../services/inventory-ledger.service';

export type CancelInventoryMovementCommand = {
  current_user: AuthenticatedUserContext;
  inventory_movement_id: number;
  dto: CancelInventoryMovementDto;
  idempotency_key?: string | null;
};

@Injectable()
export class CancelInventoryMovementUseCase
  implements
    CommandUseCase<
      CancelInventoryMovementCommand,
      CancelInventoryMovementResultView
    >
{
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly entity_code_service: EntityCodeService,
    private readonly inventory_movement_headers_repository: InventoryMovementHeadersRepository,
    private readonly inventory_movement_access_policy: InventoryMovementAccessPolicy,
    private readonly inventory_movement_lifecycle_policy: InventoryMovementLifecyclePolicy,
    private readonly inventory_movement_serializer: InventoryMovementSerializer,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    inventory_movement_id,
    dto,
    idempotency_key,
  }: CancelInventoryMovementCommand): Promise<CancelInventoryMovementResultView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `inventory.inventory_movements.cancel.${inventory_movement_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          inventory_movement_id,
          notes: dto?.notes ?? null,
        },
      },
      async (manager) => {
        const movement_header =
          await this.inventory_movement_headers_repository.find_by_id_in_business_for_update(
            manager,
            inventory_movement_id,
            business_id,
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
        this.inventory_movement_lifecycle_policy.assert_cancellable(
          movement_header,
        );

        const loaded_lines = [...(movement_header.lines ?? [])].sort(
          (left, right) => left.line_no - right.line_no,
        );
        if (!loaded_lines.length) {
          throw new DomainBadRequestException({
            code: 'INVENTORY_MOVEMENT_LINES_REQUIRED',
            messageKey: 'inventory.movement_lines_required',
            details: {
              inventory_movement_id,
            },
          });
        }

        const loaded_warehouses = loaded_lines.map((line) => {
          if (!line.warehouse || !line.product_variant) {
            throw new DomainBadRequestException({
              code: 'INVENTORY_MOVEMENT_RELATION_MISSING',
              messageKey: 'inventory.movement_relation_missing',
              details: {
                inventory_movement_id,
                line_id: line.id,
              },
            });
          }

          return line.warehouse;
        });

        const branch_id =
          movement_header.branch_id ??
          this.inventory_ledger_service.resolve_operational_branch_id(
            current_user,
            loaded_warehouses,
          );
        const branch_business_id =
          movement_header.branch?.business_id ?? business_id;

        for (const movement_line of loaded_lines) {
          const warehouse = movement_line.warehouse!;
          const product_variant = movement_line.product_variant!;
          await this.inventory_ledger_service.assert_warehouse_allowed_for_branch(
            business_id,
            warehouse,
            branch_id,
          );
          this.inventory_ledger_service.assert_tenant_consistency(
            business_id,
            branch_business_id,
            warehouse,
            product_variant,
          );
        }

        const { original_header, compensating_header, compensating_lines } =
          await this.inventory_ledger_service.cancel_posted_movement(manager, {
            original_header: movement_header,
            performed_by_user_id: current_user.id,
            occurred_at: new Date(),
            notes: dto?.notes ?? null,
          });

        await this.sync_legacy_warehouse_stock(
          manager,
          compensating_header.business_id,
          compensating_header.branch_id ?? branch_id,
          compensating_lines,
        );
        await this.sync_inventory_lot_quantities(manager, compensating_lines);
        const legacy_movement_ids =
          await this.create_legacy_compensating_movements(
            manager,
            current_user,
            original_header,
            compensating_header,
            compensating_lines,
            compensating_header.branch_id ?? branch_id,
          );
        await this.reverse_transfer_serials_if_needed(
          manager,
          current_user,
          original_header,
          compensating_header,
        );

        compensating_header.branch = movement_header.branch ?? undefined;
        compensating_header.lines = compensating_lines;

        return this.inventory_movement_serializer.serialize_cancel_result(
          original_header,
          compensating_header,
          {
            legacy_movement_ids,
          },
        );
      },
    );
  }

  private async sync_legacy_warehouse_stock(
    manager: EntityManager,
    business_id: number,
    branch_id: number,
    movement_lines: InventoryMovementLine[],
  ): Promise<void> {
    const warehouse_stock_repository = manager.getRepository(WarehouseStock);

    for (const movement_line of movement_lines) {
      const product_variant = movement_line.product_variant;
      if (!product_variant) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_MOVEMENT_RELATION_MISSING',
          messageKey: 'inventory.movement_relation_missing',
          details: {
            line_id: movement_line.id,
          },
        });
      }

      let warehouse_stock = await warehouse_stock_repository.findOne({
        where: {
          business_id,
          warehouse_id: movement_line.warehouse_id,
          product_id: product_variant.product_id,
          product_variant_id: product_variant.id,
        },
      });

      if (!warehouse_stock) {
        warehouse_stock = warehouse_stock_repository.create({
          business_id,
          branch_id,
          warehouse_id: movement_line.warehouse_id,
          product_id: product_variant.product_id,
          product_variant_id: product_variant.id,
          quantity: 0,
          reserved_quantity: 0,
          min_stock: null,
          max_stock: null,
        });
      }

      warehouse_stock.branch_id = branch_id;
      warehouse_stock.quantity =
        Number(warehouse_stock.quantity ?? 0) +
        Number(movement_line.on_hand_delta ?? 0);
      warehouse_stock.reserved_quantity =
        Number(warehouse_stock.reserved_quantity ?? 0) +
        Number(movement_line.reserved_delta ?? 0);

      await warehouse_stock_repository.save(warehouse_stock);
    }
  }

  private async sync_inventory_lot_quantities(
    manager: EntityManager,
    movement_lines: InventoryMovementLine[],
  ): Promise<void> {
    const inventory_lot_repository = manager.getRepository(InventoryLot);

    for (const movement_line of movement_lines) {
      if (movement_line.inventory_lot_id === null) {
        continue;
      }

      const inventory_lot = await inventory_lot_repository.findOne({
        where: {
          id: movement_line.inventory_lot_id,
        },
      });
      if (!inventory_lot) {
        throw new DomainNotFoundException({
          code: 'INVENTORY_LOT_NOT_FOUND',
          messageKey: 'inventory.inventory_lot_not_found',
          details: {
            inventory_lot_id: movement_line.inventory_lot_id,
          },
        });
      }

      const next_quantity =
        Number(inventory_lot.current_quantity ?? 0) +
        Number(movement_line.on_hand_delta ?? 0);
      if (next_quantity < 0) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_NEGATIVE_BALANCE_FORBIDDEN',
          messageKey: 'inventory.inventory_lot_negative_balance_forbidden',
          details: {
            inventory_lot_id: inventory_lot.id,
          },
        });
      }

      inventory_lot.current_quantity = next_quantity;
      if (movement_line.location_id !== null) {
        inventory_lot.location_id = movement_line.location_id;
      }
      await inventory_lot_repository.save(inventory_lot);
    }
  }

  private async create_legacy_compensating_movements(
    manager: EntityManager,
    current_user: AuthenticatedUserContext,
    original_header: InventoryMovementHeader,
    compensating_header: InventoryMovementHeader,
    compensating_lines: InventoryMovementLine[],
    branch_id: number,
  ): Promise<number[]> {
    const inventory_movement_repository =
      manager.getRepository(InventoryMovement);
    const warehouse_stock_repository = manager.getRepository(WarehouseStock);
    const legacy_movement_ids: number[] = [];

    for (const movement_line of compensating_lines) {
      const product_variant = movement_line.product_variant;
      if (!product_variant) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_MOVEMENT_RELATION_MISSING',
          messageKey: 'inventory.movement_relation_missing',
          details: {
            line_id: movement_line.id,
          },
        });
      }

      const warehouse_stock = await warehouse_stock_repository.findOne({
        where: {
          business_id: compensating_header.business_id,
          warehouse_id: movement_line.warehouse_id,
          product_id: product_variant.product_id,
          product_variant_id: product_variant.id,
        },
      });
      const new_quantity = Number(warehouse_stock?.quantity ?? 0);
      const delta = Number(movement_line.on_hand_delta ?? 0);
      const previous_quantity = new_quantity - delta;

      let legacy_movement = await inventory_movement_repository.save(
        inventory_movement_repository.create({
          business_id: compensating_header.business_id,
          branch_id,
          warehouse_id: movement_line.warehouse_id,
          location_id: movement_line.location_id,
          product_id: product_variant.product_id,
          product_variant_id: product_variant.id,
          inventory_lot_id: movement_line.inventory_lot_id,
          movement_type: this.map_legacy_movement_type(
            original_header.movement_type,
            delta,
          ),
          reference_type: 'inventory_movement_cancellation',
          reference_id: compensating_header.id,
          quantity: Math.abs(Number(movement_line.quantity)),
          previous_quantity,
          new_quantity,
          notes: compensating_header.notes,
          created_by: current_user.id,
        }),
      );

      legacy_movement = await this.entity_code_service.ensure_code(
        inventory_movement_repository,
        legacy_movement,
        'IM',
      );
      legacy_movement_ids.push(legacy_movement.id);
    }

    return legacy_movement_ids;
  }

  private async reverse_transfer_serials_if_needed(
    manager: EntityManager,
    current_user: AuthenticatedUserContext,
    original_header: InventoryMovementHeader,
    compensating_header: InventoryMovementHeader,
  ): Promise<void> {
    if (
      original_header.movement_type !== InventoryMovementHeaderType.TRANSFER
    ) {
      return;
    }

    const serial_event_repository = manager.getRepository(SerialEvent);
    const serial_repository = manager.getRepository(ProductSerial);
    const transfer_events = await serial_event_repository.find({
      where: {
        business_id: original_header.business_id,
        movement_header_id: original_header.id,
        event_type: SerialEventType.TRANSFERRED,
      },
      relations: {
        serial: true,
      },
    });

    for (const transfer_event of transfer_events) {
      if (!transfer_event.serial || transfer_event.from_warehouse_id === null) {
        continue;
      }

      transfer_event.serial.warehouse_id = transfer_event.from_warehouse_id;
      await serial_repository.save(transfer_event.serial);
      await serial_event_repository.save(
        serial_event_repository.create({
          business_id: original_header.business_id,
          serial_id: transfer_event.serial_id,
          event_type: SerialEventType.TRANSFERRED,
          from_warehouse_id: transfer_event.to_warehouse_id,
          to_warehouse_id: transfer_event.from_warehouse_id,
          movement_header_id: compensating_header.id,
          performed_by_user_id: current_user.id,
          notes: compensating_header.notes,
          occurred_at: compensating_header.occurred_at,
        }),
      );
    }
  }

  private map_legacy_movement_type(
    movement_type: InventoryMovementHeader['movement_type'],
    delta: number,
  ): InventoryMovementType {
    if (movement_type === InventoryMovementHeaderType.TRANSFER) {
      return delta < 0
        ? InventoryMovementType.TRANSFER_OUT
        : InventoryMovementType.TRANSFER_IN;
    }

    return delta < 0
      ? InventoryMovementType.ADJUSTMENT_OUT
      : InventoryMovementType.ADJUSTMENT_IN;
  }
}
