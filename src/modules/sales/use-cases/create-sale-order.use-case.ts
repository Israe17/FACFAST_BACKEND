import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderLine } from '../entities/sale-order-line.entity';
import { SaleOrderLineSerial } from '../entities/sale-order-line-serial.entity';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderModePolicy } from '../policies/sale-order-mode.policy';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';
import { SalesValidationService } from '../services/sales-validation.service';
import { get_dispatch_status_for_fulfillment_mode } from '../utils/sale-dispatch-status.util';
import { Contact } from '../../contacts/entities/contact.entity';
import { isWithinCostaRica } from '../../common/utils/geo.utils';

export type CreateSaleOrderCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateSaleOrderDto;
};

@Injectable()
export class CreateSaleOrderUseCase
  implements CommandUseCase<CreateSaleOrderCommand, SaleOrderView>
{
  constructor(
    private readonly data_source: DataSource,
    private readonly entity_code_service: EntityCodeService,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly sale_order_mode_policy: SaleOrderModePolicy,
    private readonly sales_validation_service: SalesValidationService,
    private readonly sale_order_serializer: SaleOrderSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateSaleOrderCommand): Promise<SaleOrderView> {
    const business_id = resolve_effective_business_id(current_user);

    this.sale_order_access_policy.assert_can_access_branch_id(
      current_user,
      dto.branch_id,
    );
    this.sale_order_mode_policy.assert_mode_coherence(dto);
    await this.sales_validation_service.validate_sale_order_references(
      current_user,
      {
        branch_id: dto.branch_id,
        customer_contact_id: dto.customer_contact_id,
        seller_user_id: dto.seller_user_id,
        delivery_zone_id: dto.delivery_zone_id,
        warehouse_id: dto.warehouse_id,
        product_variant_ids: dto.lines.map((line) => line.product_variant_id),
      },
    );
    this.assert_replace_all_lines_payload(dto.lines);

    return this.data_source.transaction(async (manager) => {
      const order_repo = manager.getRepository(SaleOrder);

      const contact = await manager.getRepository(Contact).findOne({
        where: { id: dto.customer_contact_id, business_id },
      });

      const has_manual_coordinates =
        dto.delivery_latitude != null && dto.delivery_longitude != null;

      if (
        has_manual_coordinates &&
        !isWithinCostaRica(dto.delivery_latitude!, dto.delivery_longitude!)
      ) {
        throw new DomainBadRequestException({
          code: 'DELIVERY_COORDINATES_OUT_OF_BOUNDS',
          messageKey: 'sales.delivery_coordinates_out_of_bounds',
          details: {
            field: 'delivery_latitude',
          },
        });
      }

      const delivery_latitude = has_manual_coordinates
        ? dto.delivery_latitude!
        : (contact?.delivery_latitude ?? null);
      const delivery_longitude = has_manual_coordinates
        ? dto.delivery_longitude!
        : (contact?.delivery_longitude ?? null);

      const delivery_address =
        this.normalize_optional_string(dto.delivery_address) ??
        contact?.address ??
        null;
      const delivery_province =
        this.normalize_optional_string(dto.delivery_province) ??
        contact?.province ??
        null;
      const delivery_canton =
        this.normalize_optional_string(dto.delivery_canton) ??
        contact?.canton ??
        null;
      const delivery_district =
        this.normalize_optional_string(dto.delivery_district) ??
        contact?.district ??
        null;

      const order = order_repo.create({
        business_id,
        branch_id: dto.branch_id,
        customer_contact_id: dto.customer_contact_id,
        seller_user_id: dto.seller_user_id ?? null,
        sale_mode: dto.sale_mode,
        fulfillment_mode: dto.fulfillment_mode,
        status: SaleOrderStatus.DRAFT,
        dispatch_status: get_dispatch_status_for_fulfillment_mode(
          dto.fulfillment_mode,
        ),
        order_date: new Date(dto.order_date),
        delivery_address,
        delivery_province,
        delivery_canton,
        delivery_district,
        delivery_latitude,
        delivery_longitude,
        delivery_zone_id: dto.delivery_zone_id ?? null,
        delivery_requested_date: dto.delivery_requested_date ?? null,
        warehouse_id: dto.warehouse_id ?? null,
        notes: this.normalize_optional_string(dto.notes),
        internal_notes: this.normalize_optional_string(dto.internal_notes),
        code: dto.code?.trim() ?? null,
        created_by_user_id: current_user.id,
      });

      const saved_order = await order_repo.save(order);
      await this.entity_code_service.ensure_code(order_repo, saved_order, 'SO');

      await this.sale_orders_repository.replace_lines(
        saved_order.id,
        dto.lines.map((line_dto, index) => {
          const discount = line_dto.discount_percent ?? 0;
          const subtotal = line_dto.quantity * line_dto.unit_price;
          const discounted = subtotal * (1 - discount / 100);
          const tax = line_dto.tax_amount ?? 0;
          const total = line_dto.line_total ?? discounted + tax;

          return {
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
          };
        }),
        manager,
      );

      // Store serial selections (tentative, validated at confirm time)
      const lines_with_serials = dto.lines.filter(
        (l) => l.serial_ids && l.serial_ids.length > 0,
      );
      if (lines_with_serials.length > 0) {
        const saved_lines = await manager
          .getRepository(SaleOrderLine)
          .find({
            where: { sale_order_id: saved_order.id },
            order: { line_no: 'ASC' },
          });

        const serial_records: Partial<SaleOrderLineSerial>[] = [];
        for (const line_dto of lines_with_serials) {
          const line_index = dto.lines.indexOf(line_dto);
          const saved_line = saved_lines.find(
            (l) => l.line_no === line_index + 1,
          );
          if (!saved_line) continue;

          for (const serial_id of line_dto.serial_ids!) {
            serial_records.push({
              business_id,
              sale_order_line_id: saved_line.id,
              product_serial_id: serial_id,
              assigned_at: null,
            });
          }
        }

        if (serial_records.length > 0) {
          const serial_repo = manager.getRepository(SaleOrderLineSerial);
          await serial_repo.save(
            serial_records.map((r) => serial_repo.create(r)),
          );
        }
      }

      await this.sale_orders_repository.replace_delivery_charges(
        saved_order.id,
        (dto.delivery_charges ?? []).map((charge_dto) => ({
          business_id,
          sale_order_id: saved_order.id,
          charge_type: charge_dto.charge_type,
          amount: charge_dto.amount,
          notes: this.normalize_optional_string(charge_dto.notes),
        })),
        manager,
      );

      const full_order = await this.sale_orders_repository.find_by_id_in_business(
        saved_order.id,
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
    lines: CreateSaleOrderDto['lines'],
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
