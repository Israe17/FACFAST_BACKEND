import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { CreateMeasurementUnitDto } from '../dto/create-measurement-unit.dto';
import { UpdateMeasurementUnitDto } from '../dto/update-measurement-unit.dto';
import { MeasurementUnit } from '../entities/measurement-unit.entity';
import { MeasurementUnitsRepository } from '../repositories/measurement-units.repository';

@Injectable()
export class MeasurementUnitsService {
  constructor(
    private readonly measurement_units_repository: MeasurementUnitsRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_measurement_units(current_user: AuthenticatedUserContext) {
    const units = await this.measurement_units_repository.find_all_by_business(
      current_user.business_id,
    );
    return units.map((unit) => this.serialize_unit(unit));
  }

  async create_measurement_unit(
    current_user: AuthenticatedUserContext,
    dto: CreateMeasurementUnitDto,
  ) {
    if (
      await this.measurement_units_repository.exists_name_or_symbol_in_business(
        current_user.business_id,
        dto.name.trim(),
        dto.symbol.trim(),
      )
    ) {
      throw new ConflictException(
        'A measurement unit with this name or symbol already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('MU', dto.code);
    }

    return this.serialize_unit(
      await this.measurement_units_repository.save(
        this.measurement_units_repository.create({
          business_id: current_user.business_id,
          code: dto.code?.trim() ?? null,
          name: dto.name.trim(),
          symbol: dto.symbol.trim(),
          is_active: dto.is_active ?? true,
        }),
      ),
    );
  }

  async get_measurement_unit(
    current_user: AuthenticatedUserContext,
    measurement_unit_id: number,
  ) {
    return this.serialize_unit(
      await this.get_measurement_unit_entity(
        current_user.business_id,
        measurement_unit_id,
      ),
    );
  }

  async update_measurement_unit(
    current_user: AuthenticatedUserContext,
    measurement_unit_id: number,
    dto: UpdateMeasurementUnitDto,
  ) {
    const measurement_unit = await this.get_measurement_unit_entity(
      current_user.business_id,
      measurement_unit_id,
    );

    const next_name = dto.name?.trim() ?? measurement_unit.name;
    const next_symbol = dto.symbol?.trim() ?? measurement_unit.symbol;
    if (
      await this.measurement_units_repository.exists_name_or_symbol_in_business(
        current_user.business_id,
        next_name,
        next_symbol,
        measurement_unit.id,
      )
    ) {
      throw new ConflictException(
        'A measurement unit with this name or symbol already exists.',
      );
    }

    if (dto.code) {
      this.entity_code_service.validate_code('MU', dto.code.trim());
      measurement_unit.code = dto.code.trim();
    }
    if (dto.name) {
      measurement_unit.name = dto.name.trim();
    }
    if (dto.symbol) {
      measurement_unit.symbol = dto.symbol.trim();
    }
    if (dto.is_active !== undefined) {
      measurement_unit.is_active = dto.is_active;
    }

    return this.serialize_unit(
      await this.measurement_units_repository.save(measurement_unit),
    );
  }

  private async get_measurement_unit_entity(
    business_id: number,
    measurement_unit_id: number,
  ): Promise<MeasurementUnit> {
    const measurement_unit =
      await this.measurement_units_repository.find_by_id_in_business(
        measurement_unit_id,
        business_id,
      );
    if (!measurement_unit) {
      throw new NotFoundException('Measurement unit not found.');
    }

    return measurement_unit;
  }

  private serialize_unit(measurement_unit: MeasurementUnit) {
    return {
      id: measurement_unit.id,
      code: measurement_unit.code,
      business_id: measurement_unit.business_id,
      name: measurement_unit.name,
      symbol: measurement_unit.symbol,
      is_active: measurement_unit.is_active,
      created_at: measurement_unit.created_at,
      updated_at: measurement_unit.updated_at,
    };
  }
}
