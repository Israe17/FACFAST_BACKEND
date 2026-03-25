import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { SaleOrder } from '../../sales/entities/sale-order.entity';
import { SaleOrderLine } from '../../sales/entities/sale-order-line.entity';
import { InventoryReservation } from '../entities/inventory-reservation.entity';
import { InventoryReservationStatus } from '../enums/inventory-reservation-status.enum';
import { InventoryReservationsRepository } from '../repositories/inventory-reservations.repository';

type ReservationDeltaLine = {
  warehouse: NonNullable<InventoryReservation['warehouse']>;
  product_variant: NonNullable<InventoryReservation['product_variant']>;
  quantity: number;
};

@Injectable()
export class InventoryReservationsService {
  constructor(
    private readonly inventory_reservations_repository: InventoryReservationsRepository,
  ) {}

  async count_by_sale_order_id(
    business_id: number,
    sale_order_id: number,
  ): Promise<number> {
    return this.inventory_reservations_repository.count_by_sale_order_id(
      business_id,
      sale_order_id,
    );
  }

  async reserve_for_sale_order(
    manager: EntityManager,
    current_user: AuthenticatedUserContext,
    order: SaleOrder,
  ): Promise<ReservationDeltaLine[]> {
    const existing_reservations =
      await this.inventory_reservations_repository.find_by_sale_order_id_for_update(
        manager,
        order.business_id,
        order.id,
      );
    if (existing_reservations.length > 0) {
      throw new DomainConflictException({
        code: 'SALE_ORDER_RESERVATIONS_ALREADY_EXIST',
        messageKey: 'sales.order_reservations_already_exist',
        details: {
          order_id: order.id,
        },
      });
    }

    const trackable_lines = this.get_trackable_lines(order);
    if (!trackable_lines.length) {
      return [];
    }

    const reservation_repository = manager.getRepository(InventoryReservation);
    const reservations = trackable_lines.map((line) => {
      if (!order.warehouse) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_WAREHOUSE_REQUIRED',
          messageKey: 'sales.order_warehouse_required',
          details: {
            order_id: order.id,
          },
        });
      }

      if (!line.product_variant) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_LINE_VARIANT_REQUIRED',
          messageKey: 'sales.order_line_variant_required',
          details: {
            order_id: order.id,
            sale_order_line_id: line.id,
          },
        });
      }

      return reservation_repository.create({
        business_id: order.business_id,
        branch_id: order.branch_id,
        sale_order_id: order.id,
        sale_order_line_id: line.id,
        warehouse_id: order.warehouse.id,
        product_variant_id: line.product_variant.id,
        reserved_quantity: Number(line.quantity),
        consumed_quantity: 0,
        released_quantity: 0,
        status: InventoryReservationStatus.ACTIVE,
        created_by_user_id: current_user.id,
        released_by_user_id: null,
        consumed_by_user_id: null,
        warehouse: order.warehouse,
        product_variant: line.product_variant,
      });
    });

    await reservation_repository.save(reservations);
    return this.aggregate_delta_lines(
      reservations.map((reservation) => ({
        warehouse: reservation.warehouse!,
        product_variant: reservation.product_variant!,
        quantity: Number(reservation.reserved_quantity),
      })),
    );
  }

  async release_for_sale_order(
    manager: EntityManager,
    current_user: AuthenticatedUserContext,
    order: SaleOrder,
  ): Promise<ReservationDeltaLine[]> {
    const reservations =
      await this.inventory_reservations_repository.find_by_sale_order_id_for_update(
        manager,
        order.business_id,
        order.id,
      );
    if (!reservations.length) {
      return [];
    }

    const reservation_repository = manager.getRepository(InventoryReservation);
    const released_lines: ReservationDeltaLine[] = [];
    const reservations_to_update: InventoryReservation[] = [];

    for (const reservation of reservations) {
      const remaining_quantity = this.get_remaining_quantity(reservation);
      if (remaining_quantity <= 0) {
        continue;
      }

      reservation.released_quantity =
        Number(reservation.released_quantity) + remaining_quantity;
      reservation.released_by_user_id = current_user.id;
      reservation.status = InventoryReservationStatus.RELEASED;

      reservations_to_update.push(reservation);
      released_lines.push({
        warehouse: reservation.warehouse!,
        product_variant: reservation.product_variant!,
        quantity: remaining_quantity,
      });
    }

    if (reservations_to_update.length > 0) {
      await reservation_repository.save(reservations_to_update);
    }

    return this.aggregate_delta_lines(released_lines);
  }

  async consume_for_sale_order(
    manager: EntityManager,
    current_user: AuthenticatedUserContext,
    order: SaleOrder,
  ): Promise<ReservationDeltaLine[]> {
    const reservations =
      await this.inventory_reservations_repository.find_by_sale_order_id_for_update(
        manager,
        order.business_id,
        order.id,
      );
    const reservation_by_line_id = new Map(
      reservations.map((reservation) => [reservation.sale_order_line_id, reservation]),
    );
    const trackable_lines = this.get_trackable_lines(order);

    if (!trackable_lines.length) {
      return [];
    }

    const reservation_repository = manager.getRepository(InventoryReservation);
    const consumed_lines: ReservationDeltaLine[] = [];
    const reservations_to_update: InventoryReservation[] = [];

    for (const line of trackable_lines) {
      const reservation = reservation_by_line_id.get(line.id);
      if (!reservation) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_RESERVATION_REQUIRED',
          messageKey: 'sales.order_reservation_required',
          details: {
            order_id: order.id,
            sale_order_line_id: line.id,
          },
        });
      }

      const required_quantity = Number(line.quantity);
      const remaining_quantity = this.get_remaining_quantity(reservation);
      if (remaining_quantity < required_quantity) {
        throw new DomainBadRequestException({
          code: 'SALE_ORDER_RESERVATION_INSUFFICIENT',
          messageKey: 'sales.order_reservation_insufficient',
          details: {
            order_id: order.id,
            sale_order_line_id: line.id,
            required_quantity,
            reserved_available_quantity: remaining_quantity,
          },
        });
      }

      reservation.consumed_quantity =
        Number(reservation.consumed_quantity) + required_quantity;
      reservation.consumed_by_user_id = current_user.id;
      reservation.status =
        this.get_remaining_quantity(reservation) === 0
          ? InventoryReservationStatus.CONSUMED
          : InventoryReservationStatus.ACTIVE;

      reservations_to_update.push(reservation);
      consumed_lines.push({
        warehouse: reservation.warehouse!,
        product_variant: reservation.product_variant!,
        quantity: required_quantity,
      });
    }

    if (reservations_to_update.length > 0) {
      await reservation_repository.save(reservations_to_update);
    }

    return this.aggregate_delta_lines(consumed_lines);
  }

  private get_trackable_lines(order: SaleOrder): SaleOrderLine[] {
    return [...(order.lines ?? [])]
      .filter((line) => line.product_variant?.track_inventory !== false)
      .sort((left, right) => left.id - right.id);
  }

  private get_remaining_quantity(reservation: InventoryReservation): number {
    return (
      Number(reservation.reserved_quantity) -
      Number(reservation.consumed_quantity) -
      Number(reservation.released_quantity)
    );
  }

  private aggregate_delta_lines(
    lines: ReservationDeltaLine[],
  ): ReservationDeltaLine[] {
    const delta_by_key = new Map<string, ReservationDeltaLine>();

    for (const line of lines) {
      const key = `${line.warehouse.id}:${line.product_variant.id}`;
      const existing = delta_by_key.get(key);
      if (existing) {
        existing.quantity += Number(line.quantity);
        continue;
      }

      delta_by_key.set(key, {
        warehouse: line.warehouse,
        product_variant: line.product_variant,
        quantity: Number(line.quantity),
      });
    }

    return [...delta_by_key.values()];
  }
}
