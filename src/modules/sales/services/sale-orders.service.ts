import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CancelSaleOrderDto } from '../dto/cancel-sale-order.dto';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import { UpdateSaleOrderDto } from '../dto/update-sale-order.dto';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderLine } from '../entities/sale-order-line.entity';
import { SaleOrderDeliveryCharge } from '../entities/sale-order-delivery-charge.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { FulfillmentMode } from '../enums/fulfillment-mode.enum';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';

@Injectable()
export class SaleOrdersService {
  constructor(
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly data_source: DataSource,
  ) {}

  async get_sale_orders(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const orders =
      await this.sale_orders_repository.find_all_by_business(business_id);
    return orders.map((order) => this.serialize_order(order));
  }

  async get_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, order_id);
    return this.serialize_order(order);
  }

  async create_sale_order(
    current_user: AuthenticatedUserContext,
    dto: CreateSaleOrderDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);

    return this.data_source.transaction(async (manager) => {
      const order_repo = manager.getRepository(SaleOrder);
      const line_repo = manager.getRepository(SaleOrderLine);
      const charge_repo = manager.getRepository(SaleOrderDeliveryCharge);

      const order = order_repo.create({
        business_id,
        branch_id: dto.branch_id,
        customer_contact_id: dto.customer_contact_id,
        seller_user_id: dto.seller_user_id ?? null,
        sale_mode: dto.sale_mode,
        fulfillment_mode: dto.fulfillment_mode,
        status: SaleOrderStatus.DRAFT,
        dispatch_status:
          dto.fulfillment_mode === FulfillmentMode.DELIVERY
            ? SaleDispatchStatus.PENDING
            : SaleDispatchStatus.PENDING,
        order_date: new Date(dto.order_date),
        delivery_address: this.normalize_optional_string(dto.delivery_address),
        delivery_province: this.normalize_optional_string(dto.delivery_province),
        delivery_canton: this.normalize_optional_string(dto.delivery_canton),
        delivery_district: this.normalize_optional_string(dto.delivery_district),
        delivery_zone_id: dto.delivery_zone_id ?? null,
        delivery_requested_date: dto.delivery_requested_date ?? null,
        warehouse_id: dto.warehouse_id ?? null,
        notes: this.normalize_optional_string(dto.notes),
        internal_notes: this.normalize_optional_string(dto.internal_notes),
        code: dto.code?.trim() ?? null,
        created_by_user_id: current_user.id,
      });

      const saved_order = await this.sale_orders_repository.save(
        await order_repo.save(order),
      );

      if (dto.lines?.length) {
        const lines = dto.lines.map((line_dto, index) => {
          const discount = line_dto.discount_percent ?? 0;
          const subtotal = line_dto.quantity * line_dto.unit_price;
          const discounted = subtotal * (1 - discount / 100);
          const tax = line_dto.tax_amount ?? 0;
          const total = line_dto.line_total ?? discounted + tax;

          return line_repo.create({
            business_id,
            sale_order_id: saved_order.id,
            line_no: index + 1,
            product_variant_id: line_dto.product_variant_id,
            quantity: line_dto.quantity,
            unit_price: line_dto.unit_price,
            discount_percent: discount,
            tax_amount: tax,
            line_total: total,
            notes: this.normalize_optional_string(line_dto.notes),
          });
        });
        await line_repo.save(lines);
      }

      if (dto.delivery_charges?.length) {
        const charges = dto.delivery_charges.map((charge_dto) =>
          charge_repo.create({
            business_id,
            sale_order_id: saved_order.id,
            charge_type: charge_dto.charge_type,
            amount: charge_dto.amount,
            notes: this.normalize_optional_string(charge_dto.notes),
          }),
        );
        await charge_repo.save(charges);
      }

      const full_order =
        await this.sale_orders_repository.find_by_id_in_business(
          saved_order.id,
          business_id,
        );
      return this.serialize_order(full_order!);
    });
  }

  async update_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
    dto: UpdateSaleOrderDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, order_id);

    if (order.status !== SaleOrderStatus.DRAFT) {
      throw new DomainConflictException({
        code: 'SALE_ORDER_NOT_EDITABLE',
        messageKey: 'sales.order_not_editable',
        details: { status: order.status },
      });
    }

    return this.data_source.transaction(async (manager) => {
      const order_repo = manager.getRepository(SaleOrder);
      const line_repo = manager.getRepository(SaleOrderLine);
      const charge_repo = manager.getRepository(SaleOrderDeliveryCharge);

      if (dto.branch_id !== undefined) order.branch_id = dto.branch_id;
      if (dto.customer_contact_id !== undefined)
        order.customer_contact_id = dto.customer_contact_id;
      if (dto.seller_user_id !== undefined)
        order.seller_user_id = dto.seller_user_id ?? null;
      if (dto.sale_mode !== undefined) order.sale_mode = dto.sale_mode;
      if (dto.fulfillment_mode !== undefined)
        order.fulfillment_mode = dto.fulfillment_mode;
      if (dto.order_date !== undefined)
        order.order_date = new Date(dto.order_date);
      if (dto.delivery_address !== undefined)
        order.delivery_address = this.normalize_optional_string(
          dto.delivery_address,
        );
      if (dto.delivery_province !== undefined)
        order.delivery_province = this.normalize_optional_string(
          dto.delivery_province,
        );
      if (dto.delivery_canton !== undefined)
        order.delivery_canton = this.normalize_optional_string(
          dto.delivery_canton,
        );
      if (dto.delivery_district !== undefined)
        order.delivery_district = this.normalize_optional_string(
          dto.delivery_district,
        );
      if (dto.delivery_zone_id !== undefined)
        order.delivery_zone_id = dto.delivery_zone_id ?? null;
      if (dto.delivery_requested_date !== undefined)
        order.delivery_requested_date = dto.delivery_requested_date ?? null;
      if (dto.warehouse_id !== undefined)
        order.warehouse_id = dto.warehouse_id ?? null;
      if (dto.notes !== undefined)
        order.notes = this.normalize_optional_string(dto.notes);
      if (dto.internal_notes !== undefined)
        order.internal_notes = this.normalize_optional_string(
          dto.internal_notes,
        );

      await order_repo.save(order);

      if (dto.lines !== undefined) {
        await line_repo.delete({ sale_order_id: order.id });
        if (dto.lines.length) {
          const lines = dto.lines.map((line_dto, index) => {
            const discount = line_dto.discount_percent ?? 0;
            const subtotal = line_dto.quantity * line_dto.unit_price;
            const discounted = subtotal * (1 - discount / 100);
            const tax = line_dto.tax_amount ?? 0;
            const total = line_dto.line_total ?? discounted + tax;

            return line_repo.create({
              business_id,
              sale_order_id: order.id,
              line_no: index + 1,
              product_variant_id: line_dto.product_variant_id,
              quantity: line_dto.quantity,
              unit_price: line_dto.unit_price,
              discount_percent: discount,
              tax_amount: tax,
              line_total: total,
              notes: this.normalize_optional_string(line_dto.notes),
            });
          });
          await line_repo.save(lines);
        }
      }

      if (dto.delivery_charges !== undefined) {
        await charge_repo.delete({ sale_order_id: order.id });
        if (dto.delivery_charges.length) {
          const charges = dto.delivery_charges.map((charge_dto) =>
            charge_repo.create({
              business_id,
              sale_order_id: order.id,
              charge_type: charge_dto.charge_type,
              amount: charge_dto.amount,
              notes: this.normalize_optional_string(charge_dto.notes),
            }),
          );
          await charge_repo.save(charges);
        }
      }

      const full_order =
        await this.sale_orders_repository.find_by_id_in_business(
          order.id,
          business_id,
        );
      return this.serialize_order(full_order!);
    });
  }

  async confirm_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, order_id);

    if (order.status !== SaleOrderStatus.DRAFT) {
      throw new DomainConflictException({
        code: 'SALE_ORDER_NOT_CONFIRMABLE',
        messageKey: 'sales.order_not_confirmable',
        details: { status: order.status },
      });
    }

    order.status = SaleOrderStatus.CONFIRMED;
    const saved = await this.sale_orders_repository.save(order);
    const full_order =
      await this.sale_orders_repository.find_by_id_in_business(
        saved.id,
        business_id,
      );
    return this.serialize_order(full_order!);
  }

  async cancel_sale_order(
    current_user: AuthenticatedUserContext,
    order_id: number,
    dto: CancelSaleOrderDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const order = await this.get_order_entity(business_id, order_id);

    if (order.status === SaleOrderStatus.CANCELLED) {
      throw new DomainConflictException({
        code: 'SALE_ORDER_ALREADY_CANCELLED',
        messageKey: 'sales.order_already_cancelled',
        details: { status: order.status },
      });
    }

    order.status = SaleOrderStatus.CANCELLED;
    order.dispatch_status = SaleDispatchStatus.CANCELLED;
    order.internal_notes = dto.reason
      ? `${order.internal_notes ?? ''}\n[Cancelación] ${dto.reason}`.trim()
      : order.internal_notes;

    const saved = await this.sale_orders_repository.save(order);
    const full_order =
      await this.sale_orders_repository.find_by_id_in_business(
        saved.id,
        business_id,
      );
    return this.serialize_order(full_order!);
  }

  private async get_order_entity(
    business_id: number,
    order_id: number,
  ): Promise<SaleOrder> {
    const order = await this.sale_orders_repository.find_by_id_in_business(
      order_id,
      business_id,
    );
    if (!order) {
      throw new DomainNotFoundException({
        code: 'SALE_ORDER_NOT_FOUND',
        messageKey: 'sales.order_not_found',
        details: { order_id },
      });
    }
    return order;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_order(order: SaleOrder) {
    return {
      id: order.id,
      code: order.code,
      business_id: order.business_id,
      branch_id: order.branch_id,
      branch: order.branch
        ? { id: order.branch.id, name: order.branch.name }
        : undefined,
      customer_contact_id: order.customer_contact_id,
      customer_contact: order.customer_contact
        ? { id: order.customer_contact.id, name: order.customer_contact.name }
        : undefined,
      seller_user_id: order.seller_user_id,
      seller: order.seller
        ? { id: order.seller.id, name: order.seller.name }
        : null,
      sale_mode: order.sale_mode,
      fulfillment_mode: order.fulfillment_mode,
      status: order.status,
      dispatch_status: order.dispatch_status,
      order_date: order.order_date,
      delivery_address: order.delivery_address,
      delivery_province: order.delivery_province,
      delivery_canton: order.delivery_canton,
      delivery_district: order.delivery_district,
      delivery_zone_id: order.delivery_zone_id,
      delivery_zone: order.delivery_zone
        ? { id: order.delivery_zone.id, name: order.delivery_zone.name }
        : null,
      delivery_requested_date: order.delivery_requested_date,
      warehouse_id: order.warehouse_id,
      warehouse: order.warehouse
        ? { id: order.warehouse.id, name: order.warehouse.name }
        : null,
      notes: order.notes,
      internal_notes: order.internal_notes,
      created_by_user_id: order.created_by_user_id,
      created_by_user: order.created_by_user
        ? { id: order.created_by_user.id, name: order.created_by_user.name }
        : undefined,
      lines: (order.lines ?? []).map((line) => ({
        id: line.id,
        line_no: line.line_no,
        product_variant_id: line.product_variant_id,
        product_variant: line.product_variant
          ? {
              id: line.product_variant.id,
              variant_name: line.product_variant.variant_name ?? null,
              sku: line.product_variant.sku,
              product: line.product_variant.product
                ? {
                    id: line.product_variant.product.id,
                    name: line.product_variant.product.name,
                  }
                : undefined,
            }
          : undefined,
        quantity: line.quantity,
        unit_price: line.unit_price,
        discount_percent: line.discount_percent,
        tax_amount: line.tax_amount,
        line_total: line.line_total,
        notes: line.notes,
        created_at: line.created_at,
        updated_at: line.updated_at,
      })),
      delivery_charges: (order.delivery_charges ?? []).map((charge) => ({
        id: charge.id,
        charge_type: charge.charge_type,
        amount: charge.amount,
        notes: charge.notes,
        created_at: charge.created_at,
        updated_at: charge.updated_at,
      })),
      lifecycle: {
        can_edit: order.status === SaleOrderStatus.DRAFT,
        can_confirm: order.status === SaleOrderStatus.DRAFT,
        can_cancel: order.status !== SaleOrderStatus.CANCELLED,
        reasons: [],
      },
      created_at: order.created_at,
      updated_at: order.updated_at,
    };
  }
}
