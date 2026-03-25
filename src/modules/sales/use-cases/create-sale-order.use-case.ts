import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { SaleOrderView } from '../contracts/sale-order.view';
import { CreateSaleOrderDto } from '../dto/create-sale-order.dto';
import { SaleOrder } from '../entities/sale-order.entity';
import { SaleOrderDeliveryCharge } from '../entities/sale-order-delivery-charge.entity';
import { SaleOrderLine } from '../entities/sale-order-line.entity';
import { SaleDispatchStatus } from '../enums/sale-dispatch-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrderModePolicy } from '../policies/sale-order-mode.policy';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { SaleOrderSerializer } from '../serializers/sale-order.serializer';

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
        dispatch_status: SaleDispatchStatus.PENDING,
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

      const saved_order = await order_repo.save(order);
      await this.entity_code_service.ensure_code(order_repo, saved_order, 'SO');

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

      const full_order = await this.sale_orders_repository.find_by_id_in_business(
        saved_order.id,
        business_id,
      );
      return this.sale_order_serializer.serialize(full_order!);
    });
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
