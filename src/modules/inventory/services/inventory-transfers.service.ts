import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { InventoryLedgerService } from './inventory-ledger.service';
import { InventoryValidationService } from './inventory-validation.service';
import { ProductVariantsService } from './product-variants.service';

@Injectable()
export class InventoryTransfersService {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly inventory_validation_service: InventoryValidationService,
    private readonly product_variants_service: ProductVariantsService,
    private readonly inventory_ledger_service: InventoryLedgerService,
  ) {}

  async transfer_inventory(
    current_user: AuthenticatedUserContext,
    dto: CreateInventoryTransferDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    if (dto.origin_warehouse_id === dto.destination_warehouse_id) {
      throw new DomainBadRequestException({
        code: 'TRANSFER_WAREHOUSE_DUPLICATE',
        messageKey: 'inventory.transfer_warehouse_duplicate',
      });
    }

    const origin_warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.origin_warehouse_id,
      );
    const destination_warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.destination_warehouse_id,
      );
    const product =
      await this.inventory_validation_service.get_product_in_business(
        business_id,
        dto.product_id,
      );
    this.inventory_validation_service.assert_product_is_inventory_enabled(
      product,
    );

    const product_variant =
      await this.product_variants_service.ensure_default_variant_for_product(
        product,
      );

    const branch_id =
      await this.inventory_ledger_service.resolve_operational_branch_id(
        current_user,
        [origin_warehouse, destination_warehouse],
      );

    await this.inventory_ledger_service.assert_warehouse_allowed_for_branch(
      business_id,
      origin_warehouse,
      branch_id,
    );
    await this.inventory_ledger_service.assert_warehouse_allowed_for_branch(
      business_id,
      destination_warehouse,
      branch_id,
    );

    this.inventory_ledger_service.assert_tenant_consistency(
      business_id,
      origin_warehouse.business_id,
      origin_warehouse,
      product_variant,
    );
    this.inventory_ledger_service.assert_tenant_consistency(
      business_id,
      destination_warehouse.business_id,
      destination_warehouse,
      product_variant,
    );

    return this.data_source.transaction(async (manager) => {
      const warehouse_stock_repository = manager.getRepository(WarehouseStock);
      const inventory_movement_repository =
        manager.getRepository(InventoryMovement);

      let origin_stock = await warehouse_stock_repository.findOne({
        where: {
          warehouse_id: origin_warehouse.id,
          product_id: product.id,
        },
      });

      if (!origin_stock) {
        origin_stock = warehouse_stock_repository.create({
          business_id,
          branch_id,
          warehouse_id: origin_warehouse.id,
          product_id: product.id,
          quantity: 0,
          reserved_quantity: 0,
          min_stock: null,
          max_stock: null,
        });
      }

      let destination_stock = await warehouse_stock_repository.findOne({
        where: {
          warehouse_id: destination_warehouse.id,
          product_id: product.id,
        },
      });

      if (!destination_stock) {
        destination_stock = warehouse_stock_repository.create({
          business_id,
          branch_id,
          warehouse_id: destination_warehouse.id,
          product_id: product.id,
          quantity: 0,
          reserved_quantity: 0,
          min_stock: null,
          max_stock: null,
        });
      }

      const quantity = Number(dto.quantity);
      const origin_previous_quantity = Number(origin_stock.quantity ?? 0);
      const origin_new_quantity = origin_previous_quantity - quantity;
      if (
        origin_new_quantity < 0 &&
        product_variant.allow_negative_stock === false
      ) {
        throw new DomainBadRequestException({
          code: 'INSUFFICIENT_STOCK',
          messageKey: 'inventory.insufficient_stock',
          details: {
            warehouse_id: origin_warehouse.id,
            product_id: product.id,
          },
        });
      }

      const destination_previous_quantity = Number(destination_stock.quantity ?? 0);
      const destination_new_quantity = destination_previous_quantity + quantity;

      const { header, lines } =
        await this.inventory_ledger_service.post_posted_movement(
          manager,
          {
            business_id,
            branch_id,
            performed_by_user_id: current_user.id,
            occurred_at: new Date(),
            movement_type: InventoryMovementHeaderType.TRANSFER,
            source_document_type: this.normalize_optional_string(
              dto.reference_type,
            ),
            source_document_id: dto.reference_id ?? null,
            source_document_number: null,
            notes: this.normalize_optional_string(dto.notes),
          },
          [
            {
              warehouse: origin_warehouse,
              product_variant,
              quantity,
              unit_cost: dto.unit_cost ?? null,
              on_hand_delta: -quantity,
            },
            {
              warehouse: destination_warehouse,
              product_variant,
              quantity,
              unit_cost: dto.unit_cost ?? null,
              on_hand_delta: quantity,
            },
          ],
        );

      origin_stock.quantity = origin_new_quantity;
      origin_stock.branch_id = branch_id;
      destination_stock.quantity = destination_new_quantity;
      destination_stock.branch_id = branch_id;
      await warehouse_stock_repository.save(origin_stock);
      await warehouse_stock_repository.save(destination_stock);

      const legacy_out = await inventory_movement_repository.save(
        inventory_movement_repository.create({
          business_id,
          branch_id,
          warehouse_id: origin_warehouse.id,
          location_id: null,
          product_id: product.id,
          inventory_lot_id: null,
          movement_type: InventoryMovementType.TRANSFER_OUT,
          reference_type: 'inventory_transfer',
          reference_id: header.id,
          quantity,
          previous_quantity: origin_previous_quantity,
          new_quantity: origin_new_quantity,
          notes: this.normalize_optional_string(dto.notes),
          created_by: current_user.id,
        }),
      );

      const legacy_in = await inventory_movement_repository.save(
        inventory_movement_repository.create({
          business_id,
          branch_id,
          warehouse_id: destination_warehouse.id,
          location_id: null,
          product_id: product.id,
          inventory_lot_id: null,
          movement_type: InventoryMovementType.TRANSFER_IN,
          reference_type: 'inventory_transfer',
          reference_id: header.id,
          quantity,
          previous_quantity: destination_previous_quantity,
          new_quantity: destination_new_quantity,
          notes: this.normalize_optional_string(dto.notes),
          created_by: current_user.id,
        }),
      );

      return {
        id: header.id,
        code: header.code,
        business_id: header.business_id,
        branch_id: header.branch_id,
        movement_type: header.movement_type,
        status: header.status,
        occurred_at: header.occurred_at,
        notes: header.notes,
        lines: lines.map((line) => ({
          id: line.id,
          line_no: line.line_no,
          warehouse_id: line.warehouse_id,
          product_variant_id: line.product_variant_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_cost: line.total_cost,
          on_hand_delta: line.on_hand_delta,
          linked_line_id: line.linked_line_id,
        })),
        legacy_movement_ids: [legacy_out.id, legacy_in.id],
      };
    });
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
