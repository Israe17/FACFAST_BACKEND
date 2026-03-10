import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { MeasurementUnit } from '../entities/measurement-unit.entity';

@Injectable()
export class MeasurementUnitsRepository {
  constructor(
    @InjectRepository(MeasurementUnit)
    private readonly measurement_unit_repository: Repository<MeasurementUnit>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<MeasurementUnit>): MeasurementUnit {
    return this.measurement_unit_repository.create(payload);
  }

  async save(measurement_unit: MeasurementUnit): Promise<MeasurementUnit> {
    const saved_measurement_unit =
      await this.measurement_unit_repository.save(measurement_unit);
    return this.entity_code_service.ensure_code(
      this.measurement_unit_repository,
      saved_measurement_unit,
      'MU',
    );
  }

  async find_all_by_business(business_id: number): Promise<MeasurementUnit[]> {
    return this.measurement_unit_repository.find({
      where: { business_id },
      order: { name: 'ASC' },
    });
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<MeasurementUnit | null> {
    return this.measurement_unit_repository.findOne({
      where: { id, business_id },
    });
  }

  async exists_name_or_symbol_in_business(
    business_id: number,
    name: string,
    symbol: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.measurement_unit_repository
      .createQueryBuilder('measurement_unit')
      .where('measurement_unit.business_id = :business_id', { business_id })
      .andWhere(
        '(LOWER(measurement_unit.name) = LOWER(:name) OR LOWER(measurement_unit.symbol) = LOWER(:symbol))',
        {
          name,
          symbol,
        },
      );

    if (exclude_id !== undefined) {
      query.andWhere('measurement_unit.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
