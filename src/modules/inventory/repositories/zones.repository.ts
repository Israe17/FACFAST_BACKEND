import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Zone } from '../entities/zone.entity';

@Injectable()
export class ZonesRepository {
  constructor(
    @InjectRepository(Zone)
    private readonly zone_repository: Repository<Zone>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Zone>): Zone {
    return this.zone_repository.create(payload);
  }

  async save(zone: Zone): Promise<Zone> {
    const saved_zone = await this.zone_repository.save(zone);
    return this.entity_code_service.ensure_code(
      this.zone_repository,
      saved_zone,
      'ZN',
    );
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<Zone[]> {
    const qb = this.zone_repository
      .createQueryBuilder('zone')
      .leftJoinAndSelect(
        'zone.branch_links',
        'branch_link',
        'branch_link.is_active = true',
      )
      .leftJoinAndSelect('branch_link.branch', 'branch')
      .where('zone.business_id = :business_id', { business_id })
      .orderBy('zone.name', 'ASC')
      .addOrderBy('branch.name', 'ASC')
      .distinct(true);

    if (branch_ids !== undefined) {
      if (branch_ids.length > 0) {
        qb.andWhere(
          '(zone.is_global = true OR branch_link.branch_id IN (:...branch_ids))',
          { branch_ids },
        );
      } else {
        qb.andWhere('zone.is_global = true');
      }
    }

    return qb.getMany();
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Zone | null> {
    return this.zone_repository.findOne({
      where: { id, business_id },
      relations: ['branch_links', 'branch_links.branch'],
    });
  }

  async remove(zone: Zone): Promise<void> {
    await this.zone_repository.remove(zone);
  }

  async exists_name_in_business(
    business_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.zone_repository
      .createQueryBuilder('zone')
      .where('zone.business_id = :business_id', { business_id })
      .andWhere('LOWER(zone.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('zone.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
