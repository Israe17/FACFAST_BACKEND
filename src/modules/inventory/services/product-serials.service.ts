import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { BranchAccessPolicy } from '../../branches/policies/branch-access.policy';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ProductSerial } from '../entities/product-serial.entity';
import { SerialEvent } from '../entities/serial-event.entity';
import { SerialEventType } from '../enums/serial-event-type.enum';
import { SerialStatus } from '../enums/serial-status.enum';
import { ProductSerialsRepository } from '../repositories/product-serials.repository';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { InventoryValidationService } from './inventory-validation.service';

@Injectable()
export class ProductSerialsService {
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly branch_access_policy: BranchAccessPolicy,
    private readonly product_serials_repository: ProductSerialsRepository,
    private readonly product_variants_repository: ProductVariantsRepository,
    private readonly inventory_validation_service: InventoryValidationService,
  ) {}

  async register_serials(
    current_user: AuthenticatedUserContext,
    product_variant_id: number,
    serial_numbers: string[],
    warehouse_id: number,
    performed_by_user_id: number,
  ): Promise<ProductSerial[]> {
    const business_id = resolve_effective_business_id(current_user);
    const variant =
      await this.product_variants_repository.find_by_id_in_business(
        product_variant_id,
        business_id,
      );
    if (!variant) {
      throw new DomainNotFoundException({
        code: 'PRODUCT_VARIANT_NOT_FOUND',
        messageKey: 'inventory.product_variant_not_found',
        details: { product_variant_id },
      });
    }

    if (variant.product) {
      this.inventory_validation_service.assert_product_is_active(
        variant.product,
      );
    }
    this.inventory_validation_service.assert_variant_is_active(variant);
    if (!variant.product?.track_serials) {
      throw new DomainBadRequestException({
        code: 'PRODUCT_SERIAL_TRACKING_DISABLED',
        messageKey: 'inventory.product_serial_tracking_disabled',
        details: { product_variant_id },
      });
    }

    const warehouse =
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        warehouse_id,
        {
          require_active: true,
        },
      );

    const normalized_serials = serial_numbers
      .map((serial_number) => serial_number.trim())
      .filter((serial_number) => Boolean(serial_number));
    if (!normalized_serials.length) {
      throw new DomainBadRequestException({
        code: 'SERIAL_NUMBERS_REQUIRED',
        messageKey: 'inventory.serial_numbers_required',
      });
    }

    const unique_serials = new Set(normalized_serials);
    if (unique_serials.size !== normalized_serials.length) {
      throw new DomainConflictException({
        code: 'SERIAL_NUMBER_DUPLICATE',
        messageKey: 'inventory.serial_number_duplicate',
      });
    }

    const now = new Date();
    const saved_serial_ids = await this.data_source.transaction(
      async (manager) => {
        const serial_repository = manager.getRepository(ProductSerial);
        const event_repository = manager.getRepository(SerialEvent);
        const created_serial_ids: number[] = [];

        for (const serial_number of normalized_serials) {
          const exists =
            await this.product_serials_repository.exists_serial_in_variant(
              business_id,
              product_variant_id,
              serial_number,
            );
          if (exists) {
            throw new DomainConflictException({
              code: 'SERIAL_NUMBER_DUPLICATE',
              messageKey: 'inventory.serial_number_duplicate',
              details: { serial_number },
            });
          }

          const saved_serial = await serial_repository.save(
            serial_repository.create({
              business_id,
              product_variant_id,
              serial_number,
              warehouse_id: warehouse.id,
              status: SerialStatus.AVAILABLE,
              received_at: now,
            }),
          );

          await event_repository.save(
            event_repository.create({
              business_id,
              serial_id: saved_serial.id,
              event_type: SerialEventType.RECEIVED,
              to_warehouse_id: warehouse.id,
              performed_by_user_id,
              occurred_at: now,
            }),
          );

          created_serial_ids.push(saved_serial.id);
        }

        return created_serial_ids;
      },
    );

    const hydrated_serials =
      await this.product_serials_repository.find_many_by_ids_in_business(
        business_id,
        saved_serial_ids,
      );
    return saved_serial_ids
      .map(
        (serial_id) =>
          hydrated_serials.find((serial) => serial.id === serial_id) ?? null,
      )
      .filter((serial): serial is ProductSerial => serial !== null);
  }

  async lookup_serial(
    current_user: AuthenticatedUserContext,
    serial_number: string,
  ): Promise<ProductSerial> {
    const business_id = resolve_effective_business_id(current_user);
    const serial =
      await this.product_serials_repository.find_by_serial_number_in_business(
        business_id,
        serial_number.trim(),
      );
    if (!serial) {
      throw new DomainNotFoundException({
        code: 'SERIAL_NOT_FOUND',
        messageKey: 'inventory.serial_not_found',
        details: { serial_number },
      });
    }

    this.assert_can_access_serial(current_user, serial);
    return serial;
  }

  async get_serial(
    current_user: AuthenticatedUserContext,
    serial_id: number,
  ): Promise<ProductSerial> {
    const business_id = resolve_effective_business_id(current_user);
    const serial = await this.product_serials_repository.find_by_id_in_business(
      serial_id,
      business_id,
    );
    if (!serial) {
      throw new DomainNotFoundException({
        code: 'SERIAL_NOT_FOUND',
        messageKey: 'inventory.serial_not_found',
        details: { serial_id },
      });
    }

    this.assert_can_access_serial(current_user, serial);
    return serial;
  }

  async get_serial_history(
    current_user: AuthenticatedUserContext,
    serial_id: number,
  ): Promise<{ serial: ProductSerial; events: SerialEvent[] }> {
    const business_id = resolve_effective_business_id(current_user);
    const serial = await this.product_serials_repository.find_by_id_in_business(
      serial_id,
      business_id,
    );
    if (!serial) {
      throw new DomainNotFoundException({
        code: 'SERIAL_NOT_FOUND',
        messageKey: 'inventory.serial_not_found',
        details: { serial_id },
      });
    }

    this.assert_can_access_serial(current_user, serial);
    const events =
      await this.product_serials_repository.find_events_by_serial(serial_id);
    return { serial, events };
  }

  async list_serials(
    current_user: AuthenticatedUserContext,
    product_variant_id: number,
    filters?: { status?: SerialStatus; warehouse_id?: number },
  ): Promise<ProductSerial[]> {
    const business_id = resolve_effective_business_id(current_user);

    if (filters?.warehouse_id) {
      await this.inventory_validation_service.get_warehouse_for_operation(
        current_user,
        filters.warehouse_id,
      );
    }

    const serials = await this.product_serials_repository.find_all_by_variant(
      business_id,
      product_variant_id,
      filters,
    );
    return serials.filter((serial) => {
      try {
        this.assert_can_access_serial(current_user, serial);
        return true;
      } catch {
        return false;
      }
    });
  }

  async update_serial_status(
    current_user: AuthenticatedUserContext,
    serial_id: number,
    new_status: SerialStatus,
    notes: string | null,
    performed_by_user_id: number,
  ): Promise<ProductSerial> {
    const business_id = resolve_effective_business_id(current_user);
    const serial = await this.product_serials_repository.find_by_id_in_business(
      serial_id,
      business_id,
    );
    if (!serial) {
      throw new DomainNotFoundException({
        code: 'SERIAL_NOT_FOUND',
        messageKey: 'inventory.serial_not_found',
        details: { serial_id },
      });
    }

    this.assert_can_access_serial(current_user, serial);
    if (serial.product_variant?.product) {
      this.inventory_validation_service.assert_product_is_active(
        serial.product_variant.product,
      );
    }
    if (serial.product_variant) {
      this.inventory_validation_service.assert_variant_is_active(
        serial.product_variant,
      );
    }

    const old_status = serial.status;
    serial.status = new_status;
    serial.sold_at = new_status === SerialStatus.SOLD ? new Date() : null;
    if (notes !== undefined) {
      serial.notes = notes;
    }

    const saved_serial =
      await this.product_serials_repository.save_serial(serial);

    const event = this.product_serials_repository.create_event({
      business_id,
      serial_id,
      event_type: SerialEventType.STATUS_CHANGE,
      performed_by_user_id,
      notes: `${old_status} -> ${new_status}${notes ? ': ' + notes : ''}`,
      occurred_at: new Date(),
    });
    await this.product_serials_repository.save_event(event);

    return saved_serial;
  }

  serialize_serial(serial: ProductSerial) {
    return {
      id: serial.id,
      business_id: serial.business_id,
      product_variant_id: serial.product_variant_id,
      product_variant: serial.product_variant
        ? {
            id: serial.product_variant.id,
            sku: serial.product_variant.sku,
            variant_name: serial.product_variant.variant_name,
          }
        : null,
      serial_number: serial.serial_number,
      warehouse: serial.warehouse
        ? {
            id: serial.warehouse.id,
            name: serial.warehouse.name,
          }
        : null,
      status: serial.status,
      received_at: serial.received_at,
      sold_at: serial.sold_at,
      notes: serial.notes,
      created_at: serial.created_at,
      updated_at: serial.updated_at,
    };
  }

  serialize_event(event: SerialEvent) {
    return {
      id: event.id,
      serial_id: event.serial_id,
      event_type: event.event_type,
      from_warehouse: event.from_warehouse
        ? { id: event.from_warehouse.id, name: event.from_warehouse.name }
        : null,
      to_warehouse: event.to_warehouse
        ? { id: event.to_warehouse.id, name: event.to_warehouse.name }
        : null,
      contact_id: event.contact_id,
      movement_header_id: event.movement_header_id,
      performed_by_user_id: event.performed_by_user_id,
      notes: event.notes,
      occurred_at: event.occurred_at,
      created_at: event.created_at,
    };
  }

  private assert_can_access_serial(
    current_user: AuthenticatedUserContext,
    serial: ProductSerial,
  ): void {
    if (!serial.warehouse) {
      return;
    }

    this.branch_access_policy.assert_can_access_branch(
      current_user,
      serial.warehouse.branch_id,
    );
  }
}
