import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { UpdateSaleOrderDto } from '../dto/update-sale-order.dto';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderLifecyclePolicy } from '../policies/sale-order-lifecycle.policy';
import { SaleOrderModePolicy } from '../policies/sale-order-mode.policy';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';
import { SalesValidationService } from '../services/sales-validation.service';
import { get_dispatch_status_for_fulfillment_mode } from '../utils/sale-dispatch-status.util';

export type UpdateSaleOrderCommand = {
  current_user: AuthenticatedUserContext;
  order_id: number;
  dto: UpdateSaleOrderDto;
};

@Injectable()
export class UpdateSaleOrderUseCase
  implements CommandUseCase<UpdateSaleOrderCommand, SaleOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_lifecycle_policy: SaleOrderLifecyclePolicy,
    private readonly sale_order_mode_policy: SaleOrderModePolicy,
    private readonly sales_validation_service: SalesValidationService,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    order_id,
    dto,
  }: UpdateSaleOrderCommand): Promise<SaleOrderView> {
    const business_id = resolve_effective_business_id(current_user);
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

    this.sale_order_access_policy.assert_can_access_order(current_user, order);
    this.sale_order_lifecycle_policy.assert_editable(order);

    const effective_sale_mode = dto.sale_mode ?? order.sale_mode;
    const effective_fulfillment_mode =
      dto.fulfillment_mode ?? order.fulfillment_mode;
    this.sale_order_mode_policy.assert_mode_coherence({
      sale_mode: effective_sale_mode,
      fulfillment_mode: effective_fulfillment_mode,
      seller_user_id:
        dto.seller_user_id !== undefined
          ? dto.seller_user_id
          : order.seller_user_id,
      delivery_charges: dto.delivery_charges ?? order.delivery_charges,
    });

    if (dto.branch_id !== undefined) {
      this.sale_order_access_policy.assert_can_access_branch_id(
        current_user,
        dto.branch_id,
      );
    }

    const effective_branch_id = dto.branch_id ?? order.branch_id;
    const effective_seller_user_id =
      dto.seller_user_id !== undefined ? dto.seller_user_id : order.seller_user_id;
    const effective_delivery_zone_id =
      dto.delivery_zone_id !== undefined
        ? dto.delivery_zone_id
        : order.delivery_zone_id;
    const effective_warehouse_id =
      dto.warehouse_id !== undefined ? dto.warehouse_id : order.warehouse_id;

    if (dto.customer_contact_id !== undefined) {
      await this.sales_validation_service.validate_sale_order_references(
        current_user,
        {
          branch_id: effective_branch_id,
          customer_contact_id: dto.customer_contact_id,
        },
      );
    }

    if (
      dto.seller_user_id !== undefined ||
      dto.sale_mode !== undefined ||
      dto.branch_id !== undefined
    ) {
      await this.sales_validation_service.validate_sale_order_references(
        current_user,
        {
          branch_id: effective_branch_id,
          customer_contact_id: order.customer_contact_id,
          seller_user_id: effective_seller_user_id,
        },
      );
    }

    if (dto.delivery_zone_id !== undefined || dto.branch_id !== undefined) {
      await this.sales_validation_service.validate_sale_order_references(
        current_user,
        {
          branch_id: effective_branch_id,
          customer_contact_id: order.customer_contact_id,
          delivery_zone_id: effective_delivery_zone_id,
        },
      );
    }

    if (dto.warehouse_id !== undefined || dto.branch_id !== undefined) {
      await this.sales_validation_service.validate_sale_order_references(
        current_user,
        {
          branch_id: effective_branch_id,
          customer_contact_id: order.customer_contact_id,
          warehouse_id: effective_warehouse_id,
        },
      );
    }

    if (dto.lines !== undefined) {
      this.assert_replace_all_lines_payload(dto.lines);
      await this.sales_validation_service.validate_sale_order_references(
        current_user,
        {
          branch_id: effective_branch_id,
          customer_contact_id: order.customer_contact_id,
          product_variant_ids: dto.lines.map((line) => line.product_variant_id),
        },
      );
    }

    return this.data_source.transaction(async (manager) => {
      const order_repo = manager.getRepository(SaleOrder);

      if (dto.branch_id !== undefined) order.branch_id = dto.branch_id;
      if (dto.customer_contact_id !== undefined) {
        order.customer_contact_id = dto.customer_contact_id;
      }
      if (dto.seller_user_id !== undefined) {
        order.seller_user_id = dto.seller_user_id ?? null;
      }
      if (dto.sale_mode !== undefined) order.sale_mode = dto.sale_mode;
      if (dto.fulfillment_mode !== undefined) {
        order.fulfillment_mode = dto.fulfillment_mode;
        order.dispatch_status = get_dispatch_status_for_fulfillment_mode(
          dto.fulfillment_mode,
        );
      }
      if (dto.order_date !== undefined) order.order_date = new Date(dto.order_date);
      if (dto.delivery_address !== undefined) {
        order.delivery_address = this.normalize_optional_string(
          dto.delivery_address,
        );
      }
      if (dto.delivery_province !== undefined) {
        order.delivery_province = this.normalize_optional_string(
          dto.delivery_province,
        );
      }
      if (dto.delivery_canton !== undefined) {
        order.delivery_canton = this.normalize_optional_string(
          dto.delivery_canton,
        );
      }
      if (dto.delivery_district !== undefined) {
        order.delivery_district = this.normalize_optional_string(
          dto.delivery_district,
        );
      }
      if (dto.delivery_zone_id !== undefined) {
        order.delivery_zone_id = dto.delivery_zone_id ?? null;
      }
      if (dto.delivery_requested_date !== undefined) {
        order.delivery_requested_date = dto.delivery_requested_date ?? null;
      }
      if (dto.warehouse_id !== undefined) {
        order.warehouse_id = dto.warehouse_id ?? null;
      }
      if (dto.notes !== undefined) {
        order.notes = this.normalize_optional_string(dto.notes);
      }
      if (dto.internal_notes !== undefined) {
        order.internal_notes = this.normalize_optional_string(dto.internal_notes);
      }

      await order_repo.save(order);

      if (dto.lines !== undefined) {
        await this.sale_orders_repository.replace_lines(
          order.id,
          dto.lines.map((line_dto, index) => {
            const discount = line_dto.discount_percent ?? 0;
            const subtotal = line_dto.quantity * line_dto.unit_price;
            const discounted = subtotal * (1 - discount / 100);
            const tax = line_dto.tax_amount ?? 0;
            const total = line_dto.line_total ?? discounted + tax;

            return {
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
            };
          }),
          manager,
        );
      }

      if (dto.delivery_charges !== undefined) {
        await this.sale_orders_repository.replace_delivery_charges(
          order.id,
          dto.delivery_charges.map((charge_dto) => ({
            business_id,
            sale_order_id: order.id,
            charge_type: charge_dto.charge_type,
            amount: charge_dto.amount,
            notes: this.normalize_optional_string(charge_dto.notes),
          })),
          manager,
        );
      }

      const full_order = await this.sale_orders_repository.find_by_id_in_business(
        order.id,
        business_id,
        manager,
      );
      return this.sale_order_serializer.serialize(full_order!);
    });
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private assert_replace_all_lines_payload(
    lines: NonNullable<UpdateSaleOrderDto['lines']>,
  ): void {
    if (!lines.length) {
      throw new DomainBadRequestException({
        code: 'SALE_ORDER_LINES_REQUIRED',
        messageKey: 'sales.lines_required',
        details: {
          field: 'lines',
        },
      });
    }
  }
}
