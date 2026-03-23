import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { DispatchOrder } from '../entities/dispatch-order.entity';

@Injectable()
export class DispatchOrdersRepository {
  constructor(
    @InjectRepository(DispatchOrder)
    private readonly dispatch_order_repository: Repository<DispatchOrder>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<DispatchOrder>): DispatchOrder {
    return this.dispatch_order_repository.create(payload);
  }

  async save(dispatch_order: DispatchOrder): Promise<DispatchOrder> {
    const saved = await this.dispatch_order_repository.save(dispatch_order);
    return this.entity_code_service.ensure_code(
      this.dispatch_order_repository,
      saved,
      'DO',
    );
  }

  async find_all_by_business(business_id: number): Promise<DispatchOrder[]> {
    return this.dispatch_order_repository.find({
      where: { business_id },
      relations: ['route', 'vehicle', 'driver_user', 'branch'],
      order: { scheduled_date: 'DESC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<DispatchOrder | null> {
    return this.dispatch_order_repository.findOne({
      where: { id, business_id },
      relations: [
        'route',
        'vehicle',
        'driver_user',
        'branch',
        'stops',
        'stops.sale_order',
        'stops.customer_contact',
        'expenses',
      ],
    });
  }
}
