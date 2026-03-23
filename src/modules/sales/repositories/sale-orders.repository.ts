import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { SaleOrder } from '../entities/sale-order.entity';

@Injectable()
export class SaleOrdersRepository {
  constructor(
    @InjectRepository(SaleOrder)
    private readonly sale_order_repository: Repository<SaleOrder>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<SaleOrder>): SaleOrder {
    return this.sale_order_repository.create(payload);
  }

  async save(order: SaleOrder): Promise<SaleOrder> {
    const saved_order = await this.sale_order_repository.save(order);
    return this.entity_code_service.ensure_code(
      this.sale_order_repository,
      saved_order,
      'SO',
    );
  }

  async find_all_by_business(
    business_id: number,
    options?: { relations?: string[] },
  ): Promise<SaleOrder[]> {
    return this.sale_order_repository.find({
      where: { business_id },
      relations: options?.relations ?? [
        'customer_contact',
        'seller',
        'branch',
        'delivery_zone',
        'warehouse',
        'created_by_user',
      ],
      order: { order_date: 'DESC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<SaleOrder | null> {
    return this.sale_order_repository.findOne({
      where: { id, business_id },
      relations: [
        'customer_contact',
        'seller',
        'branch',
        'delivery_zone',
        'warehouse',
        'created_by_user',
        'lines',
        'lines.product_variant',
        'delivery_charges',
      ],
    });
  }

  async remove(order: SaleOrder): Promise<void> {
    await this.sale_order_repository.remove(order);
  }
}
