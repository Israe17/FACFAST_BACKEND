import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateInventoryTransferDto } from '../dto/create-inventory-transfer.dto';
import { InventoryLot } from '../entities/inventory-lot.entity';
import { InventoryMovement } from '../entities/inventory-movement.entity';
import { ProductSerial } from '../entities/product-serial.entity';
import { SerialEvent } from '../entities/serial-event.entity';
import { WarehouseStock } from '../entities/warehouse-stock.entity';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';
import { SerialEventType } from '../enums/serial-event-type.enum';
import { SerialStatus } from '../enums/serial-status.enum';
import { ProductSerialsRepository } from '../repositories/product-serials.repository';
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
    private readonly product_serials_repository: ProductSerialsRepository,
    private readonly entity_code_service: EntityCodeService,
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
        {
          require_active: true,
        },
      );
    const destination_warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        dto.destination_warehouse_id,
        {
          require_active: true,
        },
      );
    const origin_location =
      dto.origin_location_id !== undefined && dto.origin_location_id !== null
        ? await this.inventory_validation_service.get_location_for_operation(
            current_user,
            dto.origin_location_id,
            {
              require_active: true,
            },
          )
        : null;
    const destination_location =
      dto.destination_location_id !== undefined &&
      dto.destination_location_id !== null
        ? await this.inventory_validation_service.get_location_for_operation(
            current_user,
            dto.destination_location_id,
            {
              require_active: true,
            },
          )
        : null;

    if (origin_location) {
      this.inventory_validation_service.assert_location_belongs_to_warehouse(
        origin_location,
        origin_warehouse.id,
      );
    }
    if (destination_location) {
      this.inventory_validation_service.assert_location_belongs_to_warehouse(
        destination_location,
        destination_warehouse.id,
      );
    }

    const { product, product_variant } =
      await this.product_variants_service.resolve_product_and_variant_for_operation(
        business_id,
        {
          product_id: dto.product_id,
          product_variant_id: dto.product_variant_id,
        },
      );
    this.inventory_validation_service.assert_product_is_inventory_enabled(
      product,
    );
    this.inventory_validation_service.assert_variant_is_inventory_enabled(
      product_variant,
    );

    const inventory_lot =
      dto.inventory_lot_id !== undefined && dto.inventory_lot_id !== null
        ? await this.inventory_validation_service.get_inventory_lot_for_operation(
            current_user,
            dto.inventory_lot_id,
            {
              require_active: true,
            },
          )
        : null;

    if (product_variant.track_lots && !inventory_lot) {
      throw new DomainBadRequestException({
        code: 'INVENTORY_LOT_REQUIRED',
        messageKey: 'inventory.inventory_lot_required',
      });
    }
    if (!product_variant.track_lots && inventory_lot) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_LOT_TRACKING_REQUIRED',
        messageKey: 'inventory.product_lot_tracking_required',
      });
    }

    if (inventory_lot) {
      if (inventory_lot.warehouse_id !== origin_warehouse.id) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_WAREHOUSE_MISMATCH',
          messageKey: 'inventory.inventory_lot_warehouse_mismatch',
          details: {
            inventory_lot_id: inventory_lot.id,
            warehouse_id: origin_warehouse.id,
          },
        });
      }
      if (inventory_lot.product_id !== product.id) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_PRODUCT_MISMATCH',
          messageKey: 'inventory.inventory_lot_product_mismatch',
        });
      }
      if (
        inventory_lot.product_variant_id !== null &&
        inventory_lot.product_variant_id !== product_variant.id
      ) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_VARIANT_MISMATCH',
          messageKey: 'inventory.inventory_lot_variant_mismatch',
          details: {
            inventory_lot_id: inventory_lot.id,
            product_variant_id: product_variant.id,
          },
        });
      }
      if (
        origin_location &&
        inventory_lot.location_id !== null &&
        inventory_lot.location_id !== origin_location.id
      ) {
        throw new DomainBadRequestException({
          code: 'INVENTORY_LOT_LOCATION_MISMATCH',
          messageKey: 'inventory.inventory_lot_location_mismatch',
          details: {
            inventory_lot_id: inventory_lot.id,
            location_id: origin_location.id,
          },
        });
      }
    }

    const serials = await this.resolve_serials_for_transfer(
      current_user,
      product_variant.id,
      origin_warehouse.id,
      dto.quantity,
      dto.serial_ids ?? [],
    );
    if (product.track_serials && !serials.length) {
      throw new DomainBadRequestException({
        code: 'SERIALS_REQUIRED_FOR_SERIAL_TRACKED_VARIANT',
        messageKey: 'inventory.serials_required_for_serial_tracked_variant',
        details: {
          product_variant_id: product_variant.id,
        },
      });
    }
    if (!product.track_serials && (dto.serial_ids?.length ?? 0) > 0) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_SERIAL_TRACKING_DISABLED',
        messageKey: 'inventory.product_serial_tracking_disabled',
        details: {
          product_variant_id: product_variant.id,
        },
      });
    }

    const branch_id =
      this.inventory_ledger_service.resolve_operational_branch_id(
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
      const inventory_lot_repository = manager.getRepository(InventoryLot);
      const serial_repository = manager.getRepository(ProductSerial);
      const serial_event_repository = manager.getRepository(SerialEvent);

      let origin_stock = await warehouse_stock_repository.findOne({
        where: {
          warehouse_id: origin_warehouse.id,
          product_id: product.id,
          product_variant_id: product_variant.id,
        },
      });

      if (!origin_stock) {
        origin_stock = warehouse_stock_repository.create({
          business_id,
          branch_id,
          warehouse_id: origin_warehouse.id,
          product_id: product.id,
          product_variant_id: product_variant.id,
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
          product_variant_id: product_variant.id,
        },
      });

      if (!destination_stock) {
        destination_stock = warehouse_stock_repository.create({
          business_id,
          branch_id,
          warehouse_id: destination_warehouse.id,
          product_id: product.id,
          product_variant_id: product_variant.id,
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

      const destination_previous_quantity = Number(
        destination_stock.quantity ?? 0,
      );
      const destination_new_quantity = destination_previous_quantity + quantity;

      let persisted_origin_lot: InventoryLot | null = null;
      let destination_lot: InventoryLot | null = null;
      if (inventory_lot) {
        persisted_origin_lot = await inventory_lot_repository.findOne({
          where: {
            id: inventory_lot.id,
          },
        });
        if (!persisted_origin_lot) {
          throw new DomainBadRequestException({
            code: 'INVENTORY_LOT_NOT_FOUND',
            messageKey: 'inventory.inventory_lot_not_found',
            details: {
              inventory_lot_id: inventory_lot.id,
            },
          });
        }

        const next_origin_lot_quantity =
          Number(persisted_origin_lot.current_quantity ?? 0) - quantity;
        if (next_origin_lot_quantity < 0) {
          throw new DomainBadRequestException({
            code: 'INVENTORY_LOT_NEGATIVE_BALANCE_FORBIDDEN',
            messageKey: 'inventory.inventory_lot_negative_balance_forbidden',
          });
        }

        persisted_origin_lot.current_quantity = next_origin_lot_quantity;
        if (origin_location) {
          persisted_origin_lot.location_id = origin_location.id;
        }
        await inventory_lot_repository.save(persisted_origin_lot);

        destination_lot =
          (await inventory_lot_repository.findOne({
            where: {
              warehouse_id: destination_warehouse.id,
              product_id: product.id,
              product_variant_id: product_variant.id,
              lot_number: inventory_lot.lot_number,
            },
          })) ?? null;

        if (!destination_lot) {
          destination_lot = inventory_lot_repository.create({
            business_id,
            branch_id: destination_warehouse.branch_id,
            warehouse_id: destination_warehouse.id,
            location_id: destination_location?.id ?? null,
            product_id: product.id,
            product_variant_id: product_variant.id,
            code: null,
            lot_number: inventory_lot.lot_number,
            expiration_date: inventory_lot.expiration_date,
            manufacturing_date: inventory_lot.manufacturing_date,
            received_at: inventory_lot.received_at,
            initial_quantity: 0,
            current_quantity: 0,
            unit_cost: dto.unit_cost ?? inventory_lot.unit_cost,
            supplier_contact_id: inventory_lot.supplier_contact_id,
            is_active: true,
          });
        }

        if (destination_location) {
          destination_lot.location_id = destination_location.id;
        }
        destination_lot.current_quantity =
          Number(destination_lot.current_quantity ?? 0) + quantity;
        await inventory_lot_repository.save(destination_lot);
      }

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
              location: origin_location ?? inventory_lot?.location ?? null,
              inventory_lot: persisted_origin_lot,
              product_variant,
              quantity,
              unit_cost: dto.unit_cost ?? null,
              on_hand_delta: -quantity,
            },
            {
              warehouse: destination_warehouse,
              location:
                destination_location ?? destination_lot?.location ?? null,
              inventory_lot: destination_lot,
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

      let legacy_out = await inventory_movement_repository.save(
        inventory_movement_repository.create({
          business_id,
          branch_id,
          warehouse_id: origin_warehouse.id,
          location_id:
            origin_location?.id ?? persisted_origin_lot?.location_id ?? null,
          product_id: product.id,
          product_variant_id: product_variant.id,
          inventory_lot_id: persisted_origin_lot?.id ?? null,
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
      legacy_out = await this.entity_code_service.ensure_code(
        inventory_movement_repository,
        legacy_out,
        'IM',
      );

      let legacy_in = await inventory_movement_repository.save(
        inventory_movement_repository.create({
          business_id,
          branch_id,
          warehouse_id: destination_warehouse.id,
          location_id:
            destination_location?.id ?? destination_lot?.location_id ?? null,
          product_id: product.id,
          product_variant_id: product_variant.id,
          inventory_lot_id: destination_lot?.id ?? null,
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
      legacy_in = await this.entity_code_service.ensure_code(
        inventory_movement_repository,
        legacy_in,
        'IM',
      );

      if (serials.length) {
        for (const serial of serials) {
          serial.warehouse_id = destination_warehouse.id;
          await serial_repository.save(serial);
          await serial_event_repository.save(
            serial_event_repository.create({
              business_id,
              serial_id: serial.id,
              event_type: SerialEventType.TRANSFERRED,
              from_warehouse_id: origin_warehouse.id,
              to_warehouse_id: destination_warehouse.id,
              movement_header_id: header.id,
              performed_by_user_id: current_user.id,
              occurred_at: header.occurred_at,
            }),
          );
        }
      }

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
          location_id: line.location_id,
          inventory_lot_id: line.inventory_lot_id,
          product_variant_id: line.product_variant_id,
          quantity: line.quantity,
          unit_cost: line.unit_cost,
          total_cost: line.total_cost,
          on_hand_delta: line.on_hand_delta,
          linked_line_id: line.linked_line_id,
        })),
        legacy_movement_ids: [legacy_out.id, legacy_in.id],
        transferred_serial_ids: serials.map((serial) => serial.id),
      };
    });
  }

  private async resolve_serials_for_transfer(
    current_user: AuthenticatedUserContext,
    product_variant_id: number,
    origin_warehouse_id: number,
    quantity: number,
    serial_ids: number[],
  ): Promise<ProductSerial[]> {
    const business_id = resolve_effective_business_id(current_user);
    if (!serial_ids.length) {
      return [];
    }

    if (!Number.isInteger(quantity)) {
      throw new DomainBadRequestException({
        code: 'SERIAL_TRANSFER_INTEGER_QUANTITY_REQUIRED',
        messageKey: 'inventory.serial_transfer_integer_quantity_required',
      });
    }

    const serials =
      await this.product_serials_repository.find_many_by_ids_in_business(
        business_id,
        serial_ids,
      );
    if (serials.length !== serial_ids.length) {
      throw new DomainBadRequestException({
        code: 'SERIALS_OUTSIDE_BUSINESS',
        messageKey: 'inventory.serials_outside_business',
      });
    }

    if (serials.length !== Number(quantity)) {
      throw new DomainBadRequestException({
        code: 'SERIAL_TRANSFER_QUANTITY_MISMATCH',
        messageKey: 'inventory.serial_transfer_quantity_mismatch',
        details: {
          quantity,
          serial_count: serials.length,
        },
      });
    }

    for (const serial of serials) {
      this.inventory_validation_service.assert_variant_is_active(
        serial.product_variant ?? {
          id: serial.product_variant_id,
          is_active: true,
        },
      );

      if (serial.product_variant_id !== product_variant_id) {
        throw new DomainBadRequestException({
          code: 'SERIAL_VARIANT_MISMATCH',
          messageKey: 'inventory.serial_variant_mismatch',
          details: {
            serial_id: serial.id,
            product_variant_id,
          },
        });
      }
      if (serial.warehouse_id !== origin_warehouse_id) {
        throw new DomainBadRequestException({
          code: 'SERIAL_WAREHOUSE_MISMATCH',
          messageKey: 'inventory.serial_warehouse_mismatch',
          details: {
            serial_id: serial.id,
            warehouse_id: origin_warehouse_id,
          },
        });
      }
      if (serial.status !== SerialStatus.AVAILABLE) {
        throw new DomainBadRequestException({
          code: 'SERIAL_STATUS_NOT_TRANSFERABLE',
          messageKey: 'inventory.serial_status_not_transferable',
          details: {
            serial_id: serial.id,
            status: serial.status,
          },
        });
      }
    }

    return serials;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
