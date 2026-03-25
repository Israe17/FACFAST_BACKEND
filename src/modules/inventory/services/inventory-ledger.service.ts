import { Injectable } from '@nestjs/common';
import { Brackets, EntityManager } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { BusinessSequenceService } from '../../common/services/business-sequence.service';
import { resolve_effective_branch_scope_ids } from '../../common/utils/tenant-context.util';
import { build_entity_code } from '../../common/utils/entity-code.util';
import { InventoryBalance } from '../entities/inventory-balance.entity';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovementHeader } from '../entities/inventory-movement-header.entity';
import { InventoryMovementLine } from '../entities/inventory-movement-line.entity';
import { ProductVariant } from '../entities/product-variant.entity';
import { Warehouse } from '../entities/warehouse.entity';
import { WarehouseLocation } from '../entities/warehouse-location.entity';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementStatus } from '../enums/inventory-movement-status.enum';
import { WarehouseBranchLinksRepository } from '../repositories/warehouse-branch-links.repository';

const INVENTORY_MOVEMENT_HEADER_CODE_SCOPE = 'inventory_movement_headers';

type LedgerLineInput = {
  warehouse: Warehouse;
  location?: WarehouseLocation | null;
  inventory_lot?: InventoryLot | null;
  product_variant: ProductVariant;
  quantity: number;
  unit_cost?: number | null;
  on_hand_delta?: number;
  reserved_delta?: number;
  incoming_delta?: number;
  outgoing_delta?: number;
};

type LedgerHeaderInput = {
  business_id: number;
  branch_id: number | null;
  performed_by_user_id: number;
  occurred_at: Date;
  movement_type: InventoryMovementHeader['movement_type'];
  source_document_type?: string | null;
  source_document_id?: number | null;
  source_document_number?: string | null;
  status?: InventoryMovementStatus;
  notes?: string | null;
};

type AggregatedBalanceDelta = {
  warehouse_id: number;
  product_variant_id: number;
  product_variant: ProductVariant;
  on_hand_delta: number;
  reserved_delta: number;
  incoming_delta: number;
  outgoing_delta: number;
};

@Injectable()
export class InventoryLedgerService {
  constructor(
    private readonly warehouse_branch_links_repository: WarehouseBranchLinksRepository,
    private readonly business_sequence_service: BusinessSequenceService,
  ) {}

  resolve_operational_branch_id(
    current_user: AuthenticatedUserContext,
    warehouses: Warehouse[],
  ): number {
    const candidate_branch_ids = Array.from(
      new Set(
        warehouses.flatMap((warehouse) => {
          const linked_branch_ids =
            warehouse.branch_links
              ?.filter((branch_link) => branch_link.is_active)
              .map((branch_link) => branch_link.branch_id) ?? [];

          return linked_branch_ids.length
            ? linked_branch_ids
            : [warehouse.branch_id];
        }),
      ),
    );

    if (current_user.acting_branch_id !== null) {
      if (!candidate_branch_ids.includes(current_user.acting_branch_id)) {
        throw new DomainBadRequestException({
          code: 'WAREHOUSE_NOT_ALLOWED_FOR_BRANCH',
          messageKey: 'inventory.warehouse_not_allowed_for_branch',
          details: {
            branch_id: current_user.acting_branch_id,
          },
        });
      }

      return current_user.acting_branch_id;
    }

    const scoped_branch_ids = resolve_effective_branch_scope_ids(current_user);
    if (!scoped_branch_ids || scoped_branch_ids.length === 0) {
      return candidate_branch_ids[0];
    }

    const matching_branch_id = candidate_branch_ids.find((branch_id) =>
      scoped_branch_ids.includes(branch_id),
    );
    if (!matching_branch_id) {
      throw new DomainBadRequestException({
        code: 'WAREHOUSE_NOT_ALLOWED_FOR_BRANCH',
        messageKey: 'inventory.warehouse_not_allowed_for_branch',
        details: {
          branch_ids: candidate_branch_ids,
        },
      });
    }

    return matching_branch_id;
  }

  async assert_warehouse_allowed_for_branch(
    business_id: number,
    warehouse: Warehouse,
    branch_id: number,
  ): Promise<void> {
    const has_active_link =
      await this.warehouse_branch_links_repository.exists_active_by_warehouse_and_branch(
        business_id,
        warehouse.id,
        branch_id,
      );

    if (has_active_link || warehouse.branch_id === branch_id) {
      return;
    }

    throw new DomainBadRequestException({
      code: 'WAREHOUSE_NOT_ALLOWED_FOR_BRANCH',
      messageKey: 'inventory.warehouse_not_allowed_for_branch',
      details: {
        warehouse_id: warehouse.id,
        branch_id,
      },
    });
  }

  assert_tenant_consistency(
    business_id: number,
    branch_business_id: number,
    warehouse: Warehouse,
    product_variant: ProductVariant,
  ): void {
    if (
      branch_business_id !== business_id ||
      warehouse.business_id !== business_id ||
      product_variant.business_id !== business_id
    ) {
      throw new DomainBadRequestException({
        code: 'TENANT_MISMATCH',
        messageKey: 'inventory.tenant_mismatch',
        details: {
          business_id,
          branch_business_id,
          warehouse_business_id: warehouse.business_id,
          product_variant_business_id: product_variant.business_id,
        },
      });
    }
  }

  async post_posted_movement(
    manager: EntityManager,
    header_input: LedgerHeaderInput,
    line_inputs: LedgerLineInput[],
  ): Promise<{
    header: InventoryMovementHeader;
    lines: InventoryMovementLine[];
  }> {
    if (!line_inputs.length) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_MOVEMENT_LINES_REQUIRED',
        messageKey: 'inventory.movement_lines_required',
      });
    }

    this.assert_transfer_consistency(header_input.movement_type, line_inputs);

    const inventory_balance_repository =
      manager.getRepository(InventoryBalance);
    const inventory_movement_header_repository = manager.getRepository(
      InventoryMovementHeader,
    );
    const inventory_movement_line_repository = manager.getRepository(
      InventoryMovementLine,
    );
    const header_code = await this.generate_header_code(
      manager,
      header_input.business_id,
    );

    let header = inventory_movement_header_repository.create({
      code: header_code,
      business_id: header_input.business_id,
      branch_id: header_input.branch_id ?? null,
      performed_by_user_id: header_input.performed_by_user_id,
      occurred_at: header_input.occurred_at,
      movement_type: header_input.movement_type,
      source_document_type: header_input.source_document_type ?? null,
      source_document_id: header_input.source_document_id ?? null,
      source_document_number: header_input.source_document_number ?? null,
      status: header_input.status ?? InventoryMovementStatus.POSTED,
      notes: header_input.notes ?? null,
    });
    header = await inventory_movement_header_repository.save(header);

    const aggregated_balance_deltas =
      this.aggregate_balance_deltas(line_inputs);
    const locked_balances = await this.load_balances_for_update(
      manager,
      header_input.business_id,
      aggregated_balance_deltas,
    );
    const balance_by_key = new Map(
      locked_balances.map((balance) => [
        this.build_balance_key(balance.warehouse_id, balance.product_variant_id),
        balance,
      ]),
    );
    const balances_to_save: InventoryBalance[] = [];

    for (const aggregated_delta of aggregated_balance_deltas) {
      const balance_key = this.build_balance_key(
        aggregated_delta.warehouse_id,
        aggregated_delta.product_variant_id,
      );
      const balance =
        balance_by_key.get(balance_key) ??
        inventory_balance_repository.create({
          business_id: header_input.business_id,
          warehouse_id: aggregated_delta.warehouse_id,
          product_variant_id: aggregated_delta.product_variant_id,
          on_hand_quantity: 0,
          reserved_quantity: 0,
          incoming_quantity: 0,
          outgoing_quantity: 0,
        });

      const next_on_hand_quantity =
        Number(balance.on_hand_quantity ?? 0) + aggregated_delta.on_hand_delta;
      const next_reserved_quantity =
        Number(balance.reserved_quantity ?? 0) + aggregated_delta.reserved_delta;
      const next_incoming_quantity =
        Number(balance.incoming_quantity ?? 0) + aggregated_delta.incoming_delta;
      const next_outgoing_quantity =
        Number(balance.outgoing_quantity ?? 0) + aggregated_delta.outgoing_delta;

      if (
        next_on_hand_quantity < 0 &&
        aggregated_delta.product_variant.allow_negative_stock === false
      ) {
        throw new DomainBadRequestException({
          code: 'INSUFFICIENT_STOCK',
          messageKey: 'inventory.insufficient_stock',
          details: {
            warehouse_id: aggregated_delta.warehouse_id,
            product_variant_id: aggregated_delta.product_variant_id,
          },
        });
      }

      if (
        next_reserved_quantity < 0 ||
        next_incoming_quantity < 0 ||
        next_outgoing_quantity < 0
      ) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_BALANCE_BUCKET_NEGATIVE',
          messageKey: 'inventory.balance_bucket_negative',
        });
      }

      balance.on_hand_quantity = next_on_hand_quantity;
      balance.reserved_quantity = next_reserved_quantity;
      balance.incoming_quantity = next_incoming_quantity;
      balance.outgoing_quantity = next_outgoing_quantity;
      balance_by_key.set(balance_key, balance);
      balances_to_save.push(balance);
    }

    if (balances_to_save.length > 0) {
      await inventory_balance_repository.save(balances_to_save);
    }

    const line_entities: InventoryMovementLine[] = [];
    for (let index = 0; index < line_inputs.length; index += 1) {
      const line_input = line_inputs[index];
      const quantity = Number(line_input.quantity);
      if (quantity <= 0) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_MOVEMENT_QUANTITY_INVALID',
          messageKey: 'inventory.movement_quantity_invalid',
        });
      }

      const on_hand_delta = Number(line_input.on_hand_delta ?? 0);
      const reserved_delta = Number(line_input.reserved_delta ?? 0);
      const incoming_delta = Number(line_input.incoming_delta ?? 0);
      const outgoing_delta = Number(line_input.outgoing_delta ?? 0);

      const unit_cost =
        line_input.unit_cost !== undefined && line_input.unit_cost !== null
          ? Number(line_input.unit_cost)
          : null;
      const total_cost = unit_cost !== null ? quantity * unit_cost : null;

      line_entities.push(
        inventory_movement_line_repository.create({
          business_id: header_input.business_id,
          header_id: header.id,
          line_no: index + 1,
          product_variant_id: line_input.product_variant.id,
          warehouse_id: line_input.warehouse.id,
          location_id: line_input.location?.id ?? null,
          inventory_lot_id: line_input.inventory_lot?.id ?? null,
          quantity,
          unit_cost,
          total_cost,
          on_hand_delta,
          reserved_delta,
          incoming_delta,
          outgoing_delta,
          linked_line_id: null,
        }),
      );
    }

    const persisted_lines = await inventory_movement_line_repository.save(
      line_entities,
    );
    persisted_lines.forEach((line, index) => {
      const line_input = line_inputs[index];
      line.header = header;
      line.warehouse = line_input.warehouse;
      line.location = line_input.location ?? null;
      line.inventory_lot = line_input.inventory_lot ?? null;
      line.product_variant = line_input.product_variant;
    });

    if (
      header_input.movement_type === InventoryMovementHeaderType.TRANSFER &&
      persisted_lines.length === 2
    ) {
      persisted_lines[0].linked_line_id = persisted_lines[1].id;
      persisted_lines[1].linked_line_id = persisted_lines[0].id;
      await inventory_movement_line_repository.save(persisted_lines);
    }

    return {
      header,
      lines: persisted_lines,
    };
  }

  async cancel_posted_movement(
    manager: EntityManager,
    input: {
      original_header: InventoryMovementHeader;
      performed_by_user_id: number;
      occurred_at?: Date;
      notes?: string | null;
    },
  ): Promise<{
    original_header: InventoryMovementHeader;
    compensating_header: InventoryMovementHeader;
    compensating_lines: InventoryMovementLine[];
  }> {
    const { original_header } = input;

    if (original_header.status === InventoryMovementStatus.CANCELLED) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_MOVEMENT_ALREADY_CANCELLED',
        messageKey: 'inventory.movement_already_cancelled',
        details: {
          movement_id: original_header.id,
        },
      });
    }

    if (original_header.status !== InventoryMovementStatus.POSTED) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_MOVEMENT_POSTED_REQUIRED',
        messageKey: 'inventory.movement_posted_required',
        details: {
          movement_id: original_header.id,
          status: original_header.status,
        },
      });
    }

    const original_lines = [...(original_header.lines ?? [])].sort(
      (left, right) => left.line_no - right.line_no,
    );
    if (!original_lines.length) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_MOVEMENT_LINES_REQUIRED',
        messageKey: 'inventory.movement_lines_required',
        details: {
          movement_id: original_header.id,
        },
      });
    }

    const line_inputs = this.build_compensating_line_inputs(
      original_header,
      original_lines,
    );
    const { header: compensating_header, lines: compensating_lines } =
      await this.post_posted_movement(
        manager,
        {
          business_id: original_header.business_id,
          branch_id: original_header.branch_id ?? null,
          performed_by_user_id: input.performed_by_user_id,
          occurred_at: input.occurred_at ?? new Date(),
          movement_type: original_header.movement_type,
          source_document_type: 'inventory_movement_cancellation',
          source_document_id: original_header.id,
          source_document_number: original_header.code,
          notes: this.build_cancellation_notes(
            original_header.code,
            input.notes ?? null,
          ),
        },
        line_inputs,
      );

    original_header.status = InventoryMovementStatus.CANCELLED;
    await manager.getRepository(InventoryMovementHeader).save(original_header);

    return {
      original_header,
      compensating_header,
      compensating_lines,
    };
  }

  async recalculate_balances(
    manager: EntityManager,
    business_id: number,
  ): Promise<void> {
    const inventory_balance_repository =
      manager.getRepository(InventoryBalance);
    const inventory_movement_line_repository = manager.getRepository(
      InventoryMovementLine,
    );

    await inventory_balance_repository.delete({ business_id });

    const movement_lines = await inventory_movement_line_repository.find({
      where: {
        business_id,
      },
      relations: {
        header: true,
        product_variant: true,
        warehouse: true,
      },
      order: {
        id: 'ASC',
      },
    });

    const balance_rows = new Map<
      string,
      {
        warehouse_id: number;
        product_variant_id: number;
        on_hand_quantity: number;
        reserved_quantity: number;
        incoming_quantity: number;
        outgoing_quantity: number;
      }
    >();

    for (const movement_line of movement_lines) {
      if (movement_line.header?.status !== InventoryMovementStatus.POSTED) {
        continue;
      }

      const balance_key = this.build_balance_key(
        movement_line.warehouse_id,
        movement_line.product_variant_id,
      );
      const balance =
        balance_rows.get(balance_key) ?? {
          warehouse_id: movement_line.warehouse_id,
          product_variant_id: movement_line.product_variant_id,
          on_hand_quantity: 0,
          reserved_quantity: 0,
          incoming_quantity: 0,
          outgoing_quantity: 0,
        };

      balance.on_hand_quantity += Number(movement_line.on_hand_delta);
      balance.reserved_quantity += Number(movement_line.reserved_delta);
      balance.incoming_quantity += Number(movement_line.incoming_delta);
      balance.outgoing_quantity += Number(movement_line.outgoing_delta);
      balance_rows.set(balance_key, balance);
    }

    if (balance_rows.size > 0) {
      await inventory_balance_repository.save(
        [...balance_rows.values()].map((balance) =>
          inventory_balance_repository.create({
            business_id,
            warehouse_id: balance.warehouse_id,
            product_variant_id: balance.product_variant_id,
            on_hand_quantity: balance.on_hand_quantity,
            reserved_quantity: balance.reserved_quantity,
            incoming_quantity: balance.incoming_quantity,
            outgoing_quantity: balance.outgoing_quantity,
          }),
        ),
      );
    }
  }

  private aggregate_balance_deltas(
    line_inputs: LedgerLineInput[],
  ): AggregatedBalanceDelta[] {
    const deltas_by_key = new Map<string, AggregatedBalanceDelta>();

    for (const line_input of line_inputs) {
      const balance_key = this.build_balance_key(
        line_input.warehouse.id,
        line_input.product_variant.id,
      );
      const existing_delta = deltas_by_key.get(balance_key);
      if (existing_delta) {
        existing_delta.on_hand_delta += Number(line_input.on_hand_delta ?? 0);
        existing_delta.reserved_delta += Number(
          line_input.reserved_delta ?? 0,
        );
        existing_delta.incoming_delta += Number(
          line_input.incoming_delta ?? 0,
        );
        existing_delta.outgoing_delta += Number(
          line_input.outgoing_delta ?? 0,
        );
        continue;
      }

      deltas_by_key.set(balance_key, {
        warehouse_id: line_input.warehouse.id,
        product_variant_id: line_input.product_variant.id,
        product_variant: line_input.product_variant,
        on_hand_delta: Number(line_input.on_hand_delta ?? 0),
        reserved_delta: Number(line_input.reserved_delta ?? 0),
        incoming_delta: Number(line_input.incoming_delta ?? 0),
        outgoing_delta: Number(line_input.outgoing_delta ?? 0),
      });
    }

    return [...deltas_by_key.values()];
  }

  private async load_balances_for_update(
    manager: EntityManager,
    business_id: number,
    deltas: AggregatedBalanceDelta[],
  ): Promise<InventoryBalance[]> {
    if (!deltas.length) {
      return [];
    }

    const qb = manager
      .getRepository(InventoryBalance)
      .createQueryBuilder('inventory_balance')
      .setLock('pessimistic_write')
      .where('inventory_balance.business_id = :business_id', {
        business_id,
      })
      .andWhere(
        new Brackets((sub_query) => {
          deltas.forEach((delta, index) => {
            sub_query.orWhere(
              `(inventory_balance.warehouse_id = :warehouse_id_${index} AND inventory_balance.product_variant_id = :product_variant_id_${index})`,
              {
                [`warehouse_id_${index}`]: delta.warehouse_id,
                [`product_variant_id_${index}`]: delta.product_variant_id,
              },
            );
          });
        }),
      );

    return qb.getMany();
  }

  private build_balance_key(
    warehouse_id: number,
    product_variant_id: number,
  ): string {
    return `${warehouse_id}:${product_variant_id}`;
  }

  private assert_transfer_consistency(
    movement_type: InventoryMovementHeader['movement_type'],
    line_inputs: LedgerLineInput[],
  ): void {
    if (movement_type !== InventoryMovementHeaderType.TRANSFER) {
      return;
    }

    if (line_inputs.length !== 2) {
      throw new DomainBadRequestException({
        code: 'TRANSFER_LINE_COUNT_INVALID',
        messageKey: 'inventory.transfer_line_count_invalid',
      });
    }

    const [origin_line, destination_line] = line_inputs;
    if (
      origin_line.warehouse.id === destination_line.warehouse.id ||
      Number(origin_line.quantity) !== Number(destination_line.quantity) ||
      Number(origin_line.on_hand_delta ?? 0) !==
        -Number(origin_line.quantity) ||
      Number(destination_line.on_hand_delta ?? 0) !==
        Number(destination_line.quantity)
    ) {
      throw new DomainBadRequestException({
        code: 'TRANSFER_LINE_CONSISTENCY_INVALID',
        messageKey: 'inventory.transfer_line_consistency_invalid',
      });
    }
  }

  private build_compensating_line_inputs(
    original_header: InventoryMovementHeader,
    original_lines: InventoryMovementLine[],
  ): LedgerLineInput[] {
    const ordered_original_lines =
      original_header.movement_type === InventoryMovementHeaderType.TRANSFER
        ? [...original_lines].sort(
            (left, right) =>
              Number(right.on_hand_delta ?? 0) -
              Number(left.on_hand_delta ?? 0),
          )
        : original_lines;

    return ordered_original_lines.map((original_line) => {
      if (!original_line.warehouse || !original_line.product_variant) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_MOVEMENT_RELATION_MISSING',
          messageKey: 'inventory.movement_relation_missing',
          details: {
            movement_id: original_header.id,
            line_id: original_line.id,
          },
        });
      }

      return {
        warehouse: original_line.warehouse,
        location: original_line.location ?? null,
        inventory_lot: original_line.inventory_lot ?? null,
        product_variant: original_line.product_variant,
        quantity: Number(original_line.quantity),
        unit_cost: original_line.unit_cost,
        on_hand_delta: -Number(original_line.on_hand_delta ?? 0),
        reserved_delta: -Number(original_line.reserved_delta ?? 0),
        incoming_delta: -Number(original_line.incoming_delta ?? 0),
        outgoing_delta: -Number(original_line.outgoing_delta ?? 0),
      };
    });
  }

  private build_cancellation_notes(
    original_code: string | null,
    notes: string | null,
  ): string {
    const reason = notes?.trim();
    if (reason) {
      return original_code
        ? `Cancellation for ${original_code}: ${reason}`
        : `Cancellation: ${reason}`;
    }

    return original_code
      ? `Compensating cancellation for ${original_code}`
      : 'Compensating cancellation';
  }

  private async generate_header_code(
    manager: EntityManager,
    business_id: number,
  ): Promise<string> {
    const next_value = await this.business_sequence_service.next_value(
      manager,
      business_id,
      INVENTORY_MOVEMENT_HEADER_CODE_SCOPE,
    );
    return build_entity_code('MOVE', next_value);
  }
}
