import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { TaxProfileView } from '../contracts/tax-profile.view';
import { UpdateTaxProfileDto } from '../dto/update-tax-profile.dto';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfileRulesPolicy } from '../policies/tax-profile-rules.policy';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';
import { TaxProfileSerializer } from '../serializers/tax-profile.serializer';

export type UpdateTaxProfileCommand = {
  current_user: AuthenticatedUserContext;
  tax_profile_id: number;
  dto: UpdateTaxProfileDto;
};

@Injectable()
export class UpdateTaxProfileUseCase
  implements CommandUseCase<UpdateTaxProfileCommand, TaxProfileView>
{
  constructor(
    private readonly tax_profiles_repository: TaxProfilesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly tax_profile_rules_policy: TaxProfileRulesPolicy,
    private readonly tax_profile_serializer: TaxProfileSerializer,
  ) {}

  async execute({
    current_user,
    tax_profile_id,
    dto,
  }: UpdateTaxProfileCommand): Promise<TaxProfileView> {
    const business_id = resolve_effective_business_id(current_user);
    const tax_profile = await this.find_or_throw(business_id, tax_profile_id);

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
        details: { field: 'name' },
      });
    }

    if (dto.code !== undefined) {
      if (dto.code !== null) {
        this.entity_code_service.validate_code('TF', dto.code.trim());
      }
      tax_profile.code = dto.code?.trim() ?? null;
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
    if (dto.tax_inclusion_mode !== undefined) {
      tax_profile.tax_inclusion_mode = dto.tax_inclusion_mode;
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

    this.tax_profile_rules_policy.apply(tax_profile);
    return this.tax_profile_serializer.serialize(
      await this.tax_profiles_repository.save(tax_profile),
    );
  }

  private async find_or_throw(
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
        details: { tax_profile_id },
      });
    }
    return tax_profile;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
