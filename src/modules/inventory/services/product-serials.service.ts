import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { ProductSerial } from '../entities/product-serial.entity';
import { SerialEvent } from '../entities/serial-event.entity';
import { SerialEventType } from '../enums/serial-event-type.enum';
import { SerialStatus } from '../enums/serial-status.enum';
import { ProductSerialsRepository } from '../repositories/product-serials.repository';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';

@Injectable()
export class ProductSerialsService {
  constructor(
    private readonly product_serials_repository: ProductSerialsRepository,
    private readonly product_variants_repository: ProductVariantsRepository,
  ) {}

  async register_serials(
    business_id: number,
    product_variant_id: number,
    serial_numbers: string[],
    warehouse_id: number,
    performed_by_user_id: number,
  ): Promise<ProductSerial[]> {
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

    if (!variant.track_serials) {
      throw new DomainBadRequestException({
        code: 'VARIANT_SERIAL_TRACKING_DISABLED',
        messageKey: 'inventory.variant_serial_tracking_disabled',
        details: { product_variant_id },
      });
    }

    const now = new Date();
    const results: ProductSerial[] = [];

    for (const serial_number of serial_numbers) {
      const trimmed = serial_number.trim();
      if (!trimmed) continue;

      const exists =
        await this.product_serials_repository.exists_serial_in_variant(
          business_id,
          product_variant_id,
          trimmed,
        );
      if (exists) {
        throw new DomainConflictException({
          code: 'SERIAL_NUMBER_DUPLICATE',
          messageKey: 'inventory.serial_number_duplicate',
          details: { serial_number: trimmed },
        });
      }

      const serial = this.product_serials_repository.create_serial({
        business_id,
        product_variant_id,
        serial_number: trimmed,
        warehouse_id,
        status: SerialStatus.AVAILABLE,
        received_at: now,
      });
      const saved_serial =
        await this.product_serials_repository.save_serial(serial);

      const event = this.product_serials_repository.create_event({
        business_id,
        serial_id: saved_serial.id,
        event_type: SerialEventType.RECEIVED,
        to_warehouse_id: warehouse_id,
        performed_by_user_id,
        occurred_at: now,
      });
      await this.product_serials_repository.save_event(event);

      results.push(saved_serial);
    }

    return results;
  }

  async lookup_serial(
    business_id: number,
    serial_number: string,
  ): Promise<ProductSerial> {
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
    return serial;
  }

  async get_serial_history(
    business_id: number,
    serial_id: number,
  ): Promise<{ serial: ProductSerial; events: SerialEvent[] }> {
    const serial =
      await this.product_serials_repository.find_by_id_in_business(
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
    const events =
      await this.product_serials_repository.find_events_by_serial(serial_id);
    return { serial, events };
  }

  async list_serials(
    business_id: number,
    product_variant_id: number,
    filters?: { status?: SerialStatus; warehouse_id?: number },
  ): Promise<ProductSerial[]> {
    return this.product_serials_repository.find_all_by_variant(
      business_id,
      product_variant_id,
      filters,
    );
  }

  async update_serial_status(
    business_id: number,
    serial_id: number,
    new_status: SerialStatus,
    notes: string | null,
    performed_by_user_id: number,
  ): Promise<ProductSerial> {
    const serial =
      await this.product_serials_repository.find_by_id_in_business(
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

    const old_status = serial.status;
    serial.status = new_status;
    if (new_status === SerialStatus.SOLD) {
      serial.sold_at = new Date();
    }
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
      notes: `${old_status} → ${new_status}${notes ? ': ' + notes : ''}`,
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
        ? { id: serial.warehouse.id, name: serial.warehouse.name }
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
}
