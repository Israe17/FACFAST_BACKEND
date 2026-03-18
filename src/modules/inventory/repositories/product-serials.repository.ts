import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductSerial } from '../entities/product-serial.entity';
import { SerialEvent } from '../entities/serial-event.entity';
import { SerialStatus } from '../enums/serial-status.enum';

@Injectable()
export class ProductSerialsRepository {
  constructor(
    @InjectRepository(ProductSerial)
    private readonly serial_repository: Repository<ProductSerial>,
    @InjectRepository(SerialEvent)
    private readonly event_repository: Repository<SerialEvent>,
  ) {}

  create_serial(payload: Partial<ProductSerial>): ProductSerial {
    return this.serial_repository.create(payload);
  }

  async save_serial(serial: ProductSerial): Promise<ProductSerial> {
    return this.serial_repository.save(serial);
  }

  async save_serials(serials: ProductSerial[]): Promise<ProductSerial[]> {
    return this.serial_repository.save(serials);
  }

  create_event(payload: Partial<SerialEvent>): SerialEvent {
    return this.event_repository.create(payload);
  }

  async save_event(event: SerialEvent): Promise<SerialEvent> {
    return this.event_repository.save(event);
  }

  async save_events(events: SerialEvent[]): Promise<SerialEvent[]> {
    return this.event_repository.save(events);
  }

  async find_by_id_in_business(
    serial_id: number,
    business_id: number,
  ): Promise<ProductSerial | null> {
    return this.serial_repository.findOne({
      where: { id: serial_id, business_id },
      relations: {
        product_variant: true,
        warehouse: true,
      },
    });
  }

  async find_by_serial_number_in_business(
    business_id: number,
    serial_number: string,
  ): Promise<ProductSerial | null> {
    return this.serial_repository.findOne({
      where: { business_id, serial_number },
      relations: {
        product_variant: { product: true },
        warehouse: true,
      },
    });
  }

  async find_all_by_variant(
    business_id: number,
    product_variant_id: number,
    filters?: { status?: SerialStatus; warehouse_id?: number },
  ): Promise<ProductSerial[]> {
    const where: Record<string, unknown> = {
      business_id,
      product_variant_id,
    };
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.warehouse_id) {
      where.warehouse_id = filters.warehouse_id;
    }
    return this.serial_repository.find({
      where,
      relations: { warehouse: true },
      order: { created_at: 'DESC' },
    });
  }

  async find_events_by_serial(
    serial_id: number,
  ): Promise<SerialEvent[]> {
    return this.event_repository.find({
      where: { serial_id },
      relations: {
        from_warehouse: true,
        to_warehouse: true,
        movement_header: true,
      },
      order: { occurred_at: 'DESC' },
    });
  }

  async exists_serial_in_variant(
    business_id: number,
    product_variant_id: number,
    serial_number: string,
  ): Promise<boolean> {
    return this.serial_repository.exists({
      where: {
        business_id,
        product_variant_id,
        serial_number,
      },
    });
  }
}
