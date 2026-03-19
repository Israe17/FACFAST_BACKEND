import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource, EntityManager } from 'typeorm';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CancelInventoryMovementDto } from '../dto/cancel-inventory-movement.dto';
import { CreateInventoryAdjustmentDto } from '../dto/create-inventory-adjustment.dto';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { InventoryMovementHeader } from '../entities/inventory-movement-header.entity';
import { InventoryMovementLine } from '../entities/inventory-movement-line.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
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
    return movement_headers.flatMap((movement_header) =>
      this.serialize_movement_header(movement_header),
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

    const result =
      await this.inventory_movement_headers_repository.find_paginated_by_business(
        business_id,
        branch_ids,
        query,
        (header) => this.serialize_movement_header(header),
      );

    // Flatten: each header produces an array of serialized lines
    return {
      data: result.data.flat(),
      total: result.total,
      page: result.page,
      limit: result.limit,
      total_pages: result.total_pages,
    };
  }

  async adjust_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryAdjustmentDto,
  ) {
    return this.serialize_legacy_movement(
      await this.inventory_adjustments_service.adjust_inventory(
        current_user,
        dto,
      ),
    );
  }

  async transfer_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryTransferDto,
  ) {
    return this.inventory_transfers_service.transfer_inventory(
      current_user,
      dto,
    );
  }

  async cancel_movement(
    current_user: AuthenticatedUserContext,
    movement_id: number,
    dto: CancelInventoryMovementDto,
  ) {
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

    const branch_id =
      movement_header.branch_id ??
      (await this.inventory_ledger_service.resolve_operational_branch_id(
        current_user,
        loaded_warehouses,
      ));
    const branch_business_id = movement_header.branch?.business_id ?? business_id;

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
      const {
        original_header,
        compensating_header,
        compensating_lines,
      } = await this.inventory_ledger_service.cancel_posted_movement(manager, {
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

      compensating_header.branch = movement_header.branch ?? undefined;
      compensating_header.lines = compensating_lines;

      return {
        success: true,
        cancelled_movement: {
          id: original_header.id,
          code: original_header.code,
          status: original_header.status,
        },
        compensating_movement: {
          id: compensating_header.id,
          code: compensating_header.code,
          business_id: compensating_header.business_id,
          branch_id: compensating_header.branch_id,
          movement_type: compensating_header.movement_type,
          status: compensating_header.status,
          reference_type: compensating_header.source_document_type,
          reference_id: compensating_header.source_document_id,
          reference_number: compensating_header.source_document_number,
          occurred_at: compensating_header.occurred_at,
          notes: compensating_header.notes,
          lines: this.serialize_movement_header(compensating_header),
        },
      };
    });
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

  private serialize_movement_header(movement_header: InventoryMovementHeader) {
    return (movement_header.lines ?? []).map((movement_line) =>
      this.serialize_movement_line(movement_header, movement_line),
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

  private serialize_movement_line(
    movement_header: InventoryMovementHeader,
    movement_line: InventoryMovementLine,
  ) {
    const product = movement_line.product_variant?.product;

    return {
      id: movement_line.id,
      code: movement_header.code,
      header_id: movement_header.id,
      business_id: movement_header.business_id,
      branch_id: movement_header.branch_id,
      branch: movement_header.branch
        ? {
            id: movement_header.branch.id,
            code: movement_header.branch.code,
            business_name: movement_header.branch.business_name,
          }
        : null,
      warehouse: movement_line.warehouse
        ? {
            id: movement_line.warehouse.id,
            code: movement_line.warehouse.code,
            name: movement_line.warehouse.name,
          }
        : {
            id: movement_line.warehouse_id,
          },
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
      inventory_lot: null,
      movement_type: movement_header.movement_type,
      status: movement_header.status,
      reference_type: movement_header.source_document_type,
      reference_id: movement_header.source_document_id,
      reference_number: movement_header.source_document_number,
      line_no: movement_line.line_no,
      quantity: movement_line.quantity,
      unit_cost: movement_line.unit_cost,
      total_cost: movement_line.total_cost,
      on_hand_delta: movement_line.on_hand_delta,
      reserved_delta: movement_line.reserved_delta,
      incoming_delta: movement_line.incoming_delta,
      outgoing_delta: movement_line.outgoing_delta,
      linked_line_id: movement_line.linked_line_id,
      previous_quantity: null,
      new_quantity: null,
      notes: movement_header.notes,
      created_by: movement_header.performed_by_user
        ? {
            id: movement_header.performed_by_user.id,
            code: movement_header.performed_by_user.code,
            name: movement_header.performed_by_user.name,
            email: movement_header.performed_by_user.email,
          }
        : {
            id: movement_header.performed_by_user_id,
          },
      occurred_at: movement_header.occurred_at,
      created_at: movement_line.created_at,
    };
  }
}
