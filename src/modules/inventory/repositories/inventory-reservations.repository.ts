import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { InventoryReservation } from '../entities/inventory-reservation.entity';
import { InventoryReservationStatus } from '../enums/inventory-reservation-status.enum';

@Injectable()
export class InventoryReservationsRepository {
  constructor(
    @InjectRepository(InventoryReservation)
    private readonly inventory_reservation_repository: Repository<InventoryReservation>,
  ) {}

  create(payload: Partial<InventoryReservation>): InventoryReservation {
    return this.inventory_reservation_repository.create(payload);
  }

  async count_by_sale_order_id(
    business_id: number,
    sale_order_id: number,
  ): Promise<number> {
    return this.inventory_reservation_repository.count({
      where: {
        business_id,
        sale_order_id,
        status: InventoryReservationStatus.ACTIVE,
      },
    });
  }

  async find_by_sale_order_id_for_update(
    manager: EntityManager,
    business_id: number,
    sale_order_id: number,
  ): Promise<InventoryReservation[]> {
    return manager
      .getRepository(InventoryReservation)
      .createQueryBuilder('inventory_reservation')
      .setLock('pessimistic_write', undefined, ['inventory_reservation'])
      .leftJoinAndSelect('inventory_reservation.warehouse', 'warehouse')
      .leftJoinAndSelect(
        'inventory_reservation.product_variant',
        'product_variant',
      )
      .where('inventory_reservation.business_id = :business_id', {
        business_id,
      })
      .andWhere('inventory_reservation.sale_order_id = :sale_order_id', {
        sale_order_id,
      })
      .orderBy('inventory_reservation.sale_order_line_id', 'ASC')
      .getMany();
  }
}
