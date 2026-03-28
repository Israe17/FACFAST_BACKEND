import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { Warehouse } from '../entities/warehouse.entity';

@Injectable()
export class WarehousesRepository {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouse_repository: Repository<Warehouse>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Warehouse>): Warehouse {
    return this.warehouse_repository.create(payload);
  }

  async save(warehouse: Warehouse): Promise<Warehouse> {
    const saved_warehouse = await this.warehouse_repository.save(warehouse);
    return this.entity_code_service.ensure_code(
      this.warehouse_repository,
      saved_warehouse,
      'WH',
    );
  }

  async unset_default_for_branch(branch_id: number, exclude_id?: number) {
    const query = this.warehouse_repository
      .createQueryBuilder()
      .update(Warehouse)
      .set({ is_default: false })
      .where('branch_id = :branch_id', { branch_id });

    if (exclude_id !== undefined) {
      query.andWhere('id != :exclude_id', { exclude_id });
    }

    await query.execute();
  }

  async find_all_by_business(
    business_id: number,
    branch_ids?: number[],
  ): Promise<Warehouse[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    const query = this.warehouse_repository
      .createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.branch', 'branch')
      .leftJoinAndSelect(
        'warehouse.branch_links',
        'branch_link',
        'branch_link.is_active = true',
      )
      .where('warehouse.business_id = :business_id', { business_id });

    if (branch_ids?.length) {
      query.andWhere(
        new Brackets((qb) => {
          qb.where('warehouse.branch_id IN (:...branch_ids)', {
            branch_ids,
          }).orWhere('branch_link.branch_id IN (:...branch_ids)', {
            branch_ids,
          });
        }),
      );
    }

    return query
      .orderBy('warehouse.branch_id', 'ASC')
      .addOrderBy('warehouse.is_default', 'DESC')
      .addOrderBy('warehouse.name', 'ASC')
      .distinct(true)
      .getMany();
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Warehouse | null> {
    return this.warehouse_repository
      .createQueryBuilder('warehouse')
      .leftJoinAndSelect('warehouse.branch', 'branch')
      .leftJoinAndSelect(
        'warehouse.branch_links',
        'branch_link',
        'branch_link.is_active = true',
      )
      .where('warehouse.id = :id', { id })
      .andWhere('warehouse.business_id = :business_id', { business_id })
      .getOne();
  }

  async exists_name_in_branch(
    branch_id: number,
    name: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.warehouse_repository
      .createQueryBuilder('warehouse')
      .where('warehouse.branch_id = :branch_id', { branch_id })
      .andWhere('LOWER(warehouse.name) = LOWER(:name)', { name });

    if (exclude_id !== undefined) {
      query.andWhere('warehouse.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
