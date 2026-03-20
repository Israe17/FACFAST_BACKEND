import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateMeasurementUnitDto } from '../dto/create-measurement-unit.dto';
import { UpdateMeasurementUnitDto } from '../dto/update-measurement-unit.dto';
import { MeasurementUnit } from '../entities/measurement-unit.entity';
import { MeasurementUnitsRepository } from '../repositories/measurement-units.repository';
import { ProductVariantsRepository } from '../repositories/product-variants.repository';
import { ProductsRepository } from '../repositories/products.repository';

@Injectable()
export class MeasurementUnitsService {
  constructor(
    private readonly measurement_units_repository: MeasurementUnitsRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly products_repository: ProductsRepository,
    private readonly product_variants_repository: ProductVariantsRepository,
  ) {}

  async get_measurement_units(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const units =
      await this.measurement_units_repository.find_all_by_business(business_id);
    return units.map((unit) => this.serialize_unit(unit));
  }

  async create_measurement_unit(
    current_user: AuthenticatedUserContext,
    dto: CreateMeasurementUnitDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    if (
      await this.measurement_units_repository.exists_name_or_symbol_in_business(
        business_id,
        dto.name.trim(),
        dto.symbol.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'MEASUREMENT_UNIT_NAME_OR_SYMBOL_DUPLICATE',
        messageKey: 'inventory.measurement_unit_name_or_symbol_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('MU', dto.code);
    }

    return this.serialize_unit(
      await this.measurement_units_repository.save(
        this.measurement_units_repository.create({
          business_id,
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
        resolve_effective_business_id(current_user),
        measurement_unit_id,
      ),
    );
  }

  async update_measurement_unit(
    current_user: AuthenticatedUserContext,
    measurement_unit_id: number,
    dto: UpdateMeasurementUnitDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const measurement_unit = await this.get_measurement_unit_entity(
      business_id,
      measurement_unit_id,
    );

    const next_name = dto.name?.trim() ?? measurement_unit.name;
    const next_symbol = dto.symbol?.trim() ?? measurement_unit.symbol;
    if (
      await this.measurement_units_repository.exists_name_or_symbol_in_business(
        business_id,
        next_name,
        next_symbol,
        measurement_unit.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'MEASUREMENT_UNIT_NAME_OR_SYMBOL_DUPLICATE',
        messageKey: 'inventory.measurement_unit_name_or_symbol_duplicate',
        details: {
          field: 'name',
        },
      });
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

  async delete_measurement_unit(
    current_user: AuthenticatedUserContext,
    measurement_unit_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const unit = await this.get_measurement_unit_entity(
      business_id,
      measurement_unit_id,
    );

    const product_count =
      await this.products_repository.count_by_measurement_unit_in_business(
        business_id,
        measurement_unit_id,
      );
    const variant_count =
      await this.product_variants_repository.count_by_measurement_unit_in_business(
        business_id,
        measurement_unit_id,
      );

    if (product_count + variant_count > 0) {
      throw new DomainBadRequestException({
        code: 'MEASUREMENT_UNIT_IN_USE',
        messageKey: 'inventory.measurement_unit_in_use',
        details: { measurement_unit_id, product_count, variant_count },
      });
    }

    await this.measurement_units_repository.remove(unit);
    return { id: measurement_unit_id };
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
      throw new DomainNotFoundException({
        code: 'MEASUREMENT_UNIT_NOT_FOUND',
        messageKey: 'inventory.measurement_unit_not_found',
        details: {
          measurement_unit_id,
        },
      });
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
      lifecycle: {
        can_delete: true,
        can_deactivate: measurement_unit.is_active,
        can_reactivate: !measurement_unit.is_active,
        reasons: [],
      },
      created_at: measurement_unit.created_at,
      updated_at: measurement_unit.updated_at,
    };
  }
}
