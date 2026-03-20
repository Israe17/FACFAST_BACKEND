import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CancelInventoryMovementDto } from '../dto/cancel-inventory-movement.dto';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
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
import { InventoryMovementHeadersRepository } from '../repositories/inventory-movement-headers.repository';
import { InventoryAdjustmentsService } from './inventory-adjustments.service';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryValidationService } from './inventory-validation.service';
import { InventoryTransfersService } from './inventory-transfers.service';

@Injectable()
export class InventoryMovementsService {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly entity_code_service: EntityCodeService,
    private readonly inventory_movement_headers_repository: InventoryMovementHeadersRepository,
    private readonly inventory_adjustments_service: InventoryAdjustmentsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
    private readonly inventory_transfers_service: InventoryTransfersService,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async get_movements(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const movement_headers =
      await this.inventory_movement_headers_repository.find_all_by_business(
        business_id,
        this.inventory_validation_service.resolve_accessible_branch_ids(
          current_user,
        ),
      );
    return movement_headers.map((movement_header) =>
      this.serialize_movement_record(movement_header),
    );
  }

  async get_movements_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const branch_ids =
      this.inventory_validation_service.resolve_accessible_branch_ids(
        current_user,
      );

    return this.inventory_movement_headers_repository.find_paginated_by_business(
      business_id,
      branch_ids,
      query,
      (header) => this.serialize_movement_record(header),
    );
  }

  async get_movement(
    current_user: AuthenticatedUserContext,
    movement_id: number,
  ) {
    return this.serialize_movement_record(
      await this.get_movement_header_for_access(current_user, movement_id),
    );
  }

  async adjust_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryAdjustmentDto,
  ) {
    const result = await this.inventory_adjustments_service.adjust_inventory(
      current_user,
      dto,
    );

    return this.serialize_movement_record(result.movement_header, {
      legacy_movement_ids: [result.legacy_movement.id],
      legacy_movements: [
        this.serialize_legacy_movement(result.legacy_movement),
      ],
    });
  }

  async transfer_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryTransferDto,
  ) {
    const transfer = await this.inventory_transfers_service.transfer_inventory(
      current_user,
      dto,
    );
    const movement_header = await this.get_movement_header_for_access(
      current_user,
      transfer.id,
    );

    return this.serialize_movement_record(movement_header, {
      legacy_movement_ids: transfer.legacy_movement_ids,
      transferred_serial_ids: transfer.transferred_serial_ids,
    });
  }

  async cancel_movement(
    current_user: AuthenticatedUserContext,
    movement_id: number,
    dto: CancelInventoryMovementDto,
  ) {
    const movement_header = await this.get_movement_header_for_access(
      current_user,
      movement_id,
    );

    const loaded_lines = [...(movement_header.lines ?? [])].sort(
      (left, right) => left.line_no - right.line_no,
    );
    if (!loaded_lines.length) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_MOVEMENT_LINES_REQUIRED',
        messageKey: 'inventory.movement_lines_required',
        details: {
          movement_id,
        },
      });
    }

    const loaded_warehouses = loaded_lines.map((line) => {
      if (!line.warehouse || !line.product_variant) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_MOVEMENT_RELATION_MISSING',
          messageKey: 'inventory.movement_relation_missing',
          details: {
            movement_id,
            line_id: line.id,
          },
        });
      }

      return line.warehouse;
    });

    const business_id = resolve_effective_business_id(current_user);
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

    return this.data_source.transaction(async (manager) => {
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

      return {
        success: true,
        cancelled_movement: this.serialize_movement_record(original_header),
        compensating_movement: this.serialize_movement_record(
          compensating_header,
          {
            legacy_movement_ids,
          },
        ),
      };
    });
  }

  private async get_movement_header_for_access(
    current_user: AuthenticatedUserContext,
    movement_id: number,
  ): Promise<InventoryMovementHeader> {
    const business_id = resolve_effective_business_id(current_user);
    const movement_header =
      await this.inventory_movement_headers_repository.find_by_id_in_business(
        movement_id,
        business_id,
      );
    if (!movement_header) {
      throw new DomainNotFoundException({
        code: 'INVENTORY_MOVEMENT_NOT_FOUND',
        messageKey: 'inventory.inventory_movement_not_found',
        details: {
          movement_id,
        },
      });
    }

    if (movement_header.branch_id !== null) {
      this.branch_access_policy.assert_can_access_branch(
        current_user,
        movement_header.branch_id,
      );
    }

    return movement_header;
  }

  private serialize_legacy_movement(movement: InventoryMovement) {
    return {
      id: movement.id,
      code: movement.code,
      business_id: movement.business_id,
      branch_id: movement.branch_id,
      warehouse: movement.warehouse
        ? {
            id: movement.warehouse.id,
            code: movement.warehouse.code,
            name: movement.warehouse.name,
          }
        : {
            id: movement.warehouse_id,
          },
      location: movement.location
        ? {
            id: movement.location.id,
            code: movement.location.code,
            name: movement.location.name,
          }
        : null,
      product: movement.product
        ? {
            id: movement.product.id,
            code: movement.product.code,
            name: movement.product.name,
          }
        : {
            id: movement.product_id,
          },
      inventory_lot: movement.inventory_lot
        ? {
            id: movement.inventory_lot.id,
            code: movement.inventory_lot.code,
            lot_number: movement.inventory_lot.lot_number,
          }
        : null,
      movement_type: movement.movement_type,
      reference_type: movement.reference_type,
      reference_id: movement.reference_id,
      quantity: movement.quantity,
      previous_quantity: movement.previous_quantity,
      new_quantity: movement.new_quantity,
      notes: movement.notes,
      created_by: movement.created_by_user
        ? {
            id: movement.created_by_user.id,
            code: movement.created_by_user.code,
            name: movement.created_by_user.name,
            email: movement.created_by_user.email,
          }
        : {
            id: movement.created_by,
          },
      created_at: movement.created_at,
    };
  }

  private serialize_movement_record(
    movement_header: InventoryMovementHeader,
    meta?: {
      legacy_movement_ids?: number[];
      legacy_movements?: unknown[];
      transferred_serial_ids?: number[];
    },
  ) {
    const lines = [...(movement_header.lines ?? [])]
      .sort((left, right) => left.line_no - right.line_no)
      .map((movement_line) => this.serialize_movement_line(movement_line));

    return {
      id: movement_header.id,
      code: movement_header.code,
      business_id: movement_header.business_id,
      branch_id: movement_header.branch_id,
      branch: movement_header.branch
        ? {
            id: movement_header.branch.id,
            code: movement_header.branch.code,
            business_name: movement_header.branch.business_name,
          }
        : null,
      movement_type: movement_header.movement_type,
      status: movement_header.status,
      source_document_type: movement_header.source_document_type,
      source_document_id: movement_header.source_document_id,
      source_document_number: movement_header.source_document_number,
      notes: movement_header.notes,
      occurred_at: movement_header.occurred_at,
      performed_by: movement_header.performed_by_user
        ? {
            id: movement_header.performed_by_user.id,
            code: movement_header.performed_by_user.code,
            name: movement_header.performed_by_user.name,
            email: movement_header.performed_by_user.email,
          }
        : {
            id: movement_header.performed_by_user_id,
          },
      line_count: lines.length,
      lines,
      legacy_movement_ids: meta?.legacy_movement_ids ?? [],
      legacy_movements: meta?.legacy_movements ?? [],
      transferred_serial_ids: meta?.transferred_serial_ids ?? [],
      created_at: movement_header.created_at,
      updated_at: movement_header.updated_at,
    };
  }

  private serialize_movement_line(movement_line: InventoryMovementLine) {
    const product = movement_line.product_variant?.product;

    return {
      id: movement_line.id,
      line_no: movement_line.line_no,
      warehouse: movement_line.warehouse
        ? {
            id: movement_line.warehouse.id,
            code: movement_line.warehouse.code,
            name: movement_line.warehouse.name,
          }
        : {
            id: movement_line.warehouse_id,
          },
      location: movement_line.location
        ? {
            id: movement_line.location.id,
            code: movement_line.location.code,
            name: movement_line.location.name,
          }
        : movement_line.location_id !== null
          ? { id: movement_line.location_id }
          : null,
      inventory_lot: movement_line.inventory_lot
        ? {
            id: movement_line.inventory_lot.id,
            code: movement_line.inventory_lot.code,
            lot_number: movement_line.inventory_lot.lot_number,
          }
        : movement_line.inventory_lot_id !== null
          ? { id: movement_line.inventory_lot_id }
          : null,
      product_variant: movement_line.product_variant
        ? {
            id: movement_line.product_variant.id,
            sku: movement_line.product_variant.sku,
            barcode: movement_line.product_variant.barcode,
            variant_name: movement_line.product_variant.variant_name,
            is_default: movement_line.product_variant.is_default,
          }
        : null,
      product: product
        ? {
            id: product.id,
            code: product.code,
            name: product.name,
            type: product.type,
          }
        : {
            id: movement_line.product_variant?.product_id ?? null,
          },
      quantity: movement_line.quantity,
      unit_cost: movement_line.unit_cost,
      total_cost: movement_line.total_cost,
      on_hand_delta: movement_line.on_hand_delta,
      reserved_delta: movement_line.reserved_delta,
      incoming_delta: movement_line.incoming_delta,
      outgoing_delta: movement_line.outgoing_delta,
      linked_line_id: movement_line.linked_line_id,
      created_at: movement_line.created_at,
      updated_at: movement_line.updated_at,
    };
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
