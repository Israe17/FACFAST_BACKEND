import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateTaxProfileDto } from '../dto/create-tax-profile.dto';
import { UpdateTaxProfileDto } from '../dto/update-tax-profile.dto';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxType } from '../enums/tax-type.enum';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';

@Injectable()
export class TaxProfilesService {
  constructor(
    private readonly tax_profiles_repository: TaxProfilesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_tax_profiles(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const tax_profiles =
      await this.tax_profiles_repository.find_all_by_business(business_id);
    return tax_profiles.map((tax_profile) =>
      this.serialize_tax_profile(tax_profile),
    );
  }

  async create_tax_profile(
    current_user: AuthenticatedUserContext,
    dto: CreateTaxProfileDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    if (
      await this.tax_profiles_repository.exists_name_in_business(
        business_id,
        dto.name.trim(),
      )
    ) {
      throw new DomainConflictException({
        code: 'TAX_PROFILE_NAME_DUPLICATE',
        messageKey: 'inventory.tax_profile_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('TF', dto.code);
    }

    const tax_profile = this.tax_profiles_repository.create({
      business_id,
      code: dto.code?.trim() ?? null,
      name: dto.name.trim(),
      description: this.normalize_optional_string(dto.description),
      cabys_code: dto.cabys_code.trim(),
      item_kind: dto.item_kind,
      tax_type: dto.tax_type,
      iva_rate_code: this.normalize_optional_string(dto.iva_rate_code),
      iva_rate: dto.iva_rate ?? null,
      requires_cabys: dto.requires_cabys ?? true,
      allows_exoneration: dto.allows_exoneration ?? false,
      has_specific_tax: dto.has_specific_tax ?? false,
      specific_tax_name: this.normalize_optional_string(dto.specific_tax_name),
      specific_tax_rate: dto.specific_tax_rate ?? null,
      is_active: dto.is_active ?? true,
    });

    this.apply_tax_rules(tax_profile);
    return this.serialize_tax_profile(
      await this.tax_profiles_repository.save(tax_profile),
    );
  }

  async get_tax_profile(
    current_user: AuthenticatedUserContext,
    tax_profile_id: number,
  ) {
    return this.serialize_tax_profile(
      await this.get_tax_profile_entity(
        resolve_effective_business_id(current_user),
        tax_profile_id,
      ),
    );
  }

  async update_tax_profile(
    current_user: AuthenticatedUserContext,
    tax_profile_id: number,
    dto: UpdateTaxProfileDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const tax_profile = await this.get_tax_profile_entity(
      business_id,
      tax_profile_id,
    );

    const next_name = dto.name?.trim() ?? tax_profile.name;
    if (
      await this.tax_profiles_repository.exists_name_in_business(
        business_id,
        next_name,
        tax_profile.id,
      )
    ) {
      throw new DomainConflictException({
        code: 'TAX_PROFILE_NAME_DUPLICATE',
        messageKey: 'inventory.tax_profile_name_duplicate',
        details: {
          field: 'name',
        },
      });
    }

    if (dto.code) {
      this.entity_code_service.validate_code('TF', dto.code.trim());
      tax_profile.code = dto.code.trim();
    }
    if (dto.name) {
      tax_profile.name = dto.name.trim();
    }
    if (dto.description !== undefined) {
      tax_profile.description = this.normalize_optional_string(dto.description);
    }
    if (dto.cabys_code) {
      tax_profile.cabys_code = dto.cabys_code.trim();
    }
    if (dto.item_kind) {
      tax_profile.item_kind = dto.item_kind;
    }
    if (dto.tax_type) {
      tax_profile.tax_type = dto.tax_type;
    }
    if (dto.iva_rate_code !== undefined) {
      tax_profile.iva_rate_code = this.normalize_optional_string(
        dto.iva_rate_code,
      );
    }
    if (dto.iva_rate !== undefined) {
      tax_profile.iva_rate = dto.iva_rate;
    }
    if (dto.requires_cabys !== undefined) {
      tax_profile.requires_cabys = dto.requires_cabys;
    }
    if (dto.allows_exoneration !== undefined) {
      tax_profile.allows_exoneration = dto.allows_exoneration;
    }
    if (dto.has_specific_tax !== undefined) {
      tax_profile.has_specific_tax = dto.has_specific_tax;
    }
    if (dto.specific_tax_name !== undefined) {
      tax_profile.specific_tax_name = this.normalize_optional_string(
        dto.specific_tax_name,
      );
    }
    if (dto.specific_tax_rate !== undefined) {
      tax_profile.specific_tax_rate = dto.specific_tax_rate;
    }
    if (dto.is_active !== undefined) {
      tax_profile.is_active = dto.is_active;
    }

    this.apply_tax_rules(tax_profile);
    return this.serialize_tax_profile(
      await this.tax_profiles_repository.save(tax_profile),
    );
  }

  private async get_tax_profile_entity(
    business_id: number,
    tax_profile_id: number,
  ): Promise<TaxProfile> {
    const tax_profile =
      await this.tax_profiles_repository.find_by_id_in_business(
        tax_profile_id,
        business_id,
      );
    if (!tax_profile) {
      throw new DomainNotFoundException({
        code: 'TAX_PROFILE_NOT_FOUND',
        messageKey: 'inventory.tax_profile_not_found',
        details: {
          tax_profile_id,
        },
      });
    }

    return tax_profile;
  }

  private apply_tax_rules(tax_profile: TaxProfile): void {
    if (tax_profile.tax_type === TaxType.IVA && tax_profile.iva_rate === null) {
      throw new DomainBadRequestException({
        code: 'TAX_PROFILE_IVA_RATE_REQUIRED',
        messageKey: 'inventory.tax_profile_iva_rate_required',
        details: {
          field: 'iva_rate',
        },
      });
    }

    if (tax_profile.tax_type !== TaxType.IVA) {
      tax_profile.iva_rate = null;
      tax_profile.iva_rate_code = null;
    }

    if (tax_profile.tax_type === TaxType.SPECIFIC_TAX) {
      tax_profile.has_specific_tax = true;
      if (
        !tax_profile.specific_tax_name ||
        tax_profile.specific_tax_rate === null
      ) {
        throw new DomainBadRequestException({
          code: 'TAX_PROFILE_SPECIFIC_FIELDS_REQUIRED',
          messageKey: 'inventory.tax_profile_specific_fields_required',
          details: {
            field: 'specific_tax_name',
          },
        });
      }
      return;
    }

    tax_profile.has_specific_tax = false;
    tax_profile.specific_tax_name = null;
    tax_profile.specific_tax_rate = null;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_tax_profile(tax_profile: TaxProfile) {
    return {
      id: tax_profile.id,
      code: tax_profile.code,
      business_id: tax_profile.business_id,
      name: tax_profile.name,
      description: tax_profile.description,
      cabys_code: tax_profile.cabys_code,
      item_kind: tax_profile.item_kind,
      tax_type: tax_profile.tax_type,
      iva_rate_code: tax_profile.iva_rate_code,
      iva_rate: tax_profile.iva_rate,
      requires_cabys: tax_profile.requires_cabys,
      allows_exoneration: tax_profile.allows_exoneration,
      has_specific_tax: tax_profile.has_specific_tax,
      specific_tax_name: tax_profile.specific_tax_name,
      specific_tax_rate: tax_profile.specific_tax_rate,
      is_active: tax_profile.is_active,
      lifecycle: {
        can_delete: false,
        can_deactivate: tax_profile.is_active,
        can_reactivate: !tax_profile.is_active,
        reasons: ['hard_delete_not_supported'],
      },
      created_at: tax_profile.created_at,
      updated_at: tax_profile.updated_at,
    };
  }
}
