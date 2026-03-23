import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Route } from '../entities/route.entity';

@Injectable()
export class RoutesRepository {
  constructor(
    @InjectRepository(Route)
    private readonly route_repository: Repository<Route>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Route>): Route {
    return this.route_repository.create(payload);
  }

  async save(route: Route): Promise<Route> {
    const saved_route = await this.route_repository.save(route);
    return this.entity_code_service.ensure_code(
      this.route_repository,
      saved_route,
      'RT',
    );
  }

  async find_all_by_business(business_id: number): Promise<Route[]> {
    return this.route_repository.find({
      where: { business_id },
      relations: ['zone', 'default_driver', 'default_vehicle'],
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Route | null> {
    return this.route_repository.findOne({
      where: { id, business_id },
      relations: ['zone', 'default_driver', 'default_vehicle'],
    });
  }

  async remove(route: Route): Promise<void> {
    await this.route_repository.remove(route);
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.route_repository
      .createQueryBuilder('route')
      .where('route.business_id = :business_id', { business_id })
      .andWhere('LOWER(route.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('route.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
