import { Injectable } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { TaxProfileView } from '../contracts/tax-profile.view';
import { CreateTaxProfileDto } from '../dto/create-tax-profile.dto';
import { TaxProfileRulesPolicy } from '../policies/tax-profile-rules.policy';
import { TaxProfilesRepository } from '../repositories/tax-profiles.repository';
import { TaxProfileSerializer } from '../serializers/tax-profile.serializer';

export type CreateTaxProfileCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateTaxProfileDto;
};

@Injectable()
export class CreateTaxProfileUseCase
  implements CommandUseCase<CreateTaxProfileCommand, TaxProfileView>
{
  constructor(
    private readonly tax_profiles_repository: TaxProfilesRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly tax_profile_rules_policy: TaxProfileRulesPolicy,
    private readonly tax_profile_serializer: TaxProfileSerializer,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateTaxProfileCommand): Promise<TaxProfileView> {
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
        details: { field: 'name' },
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

    this.tax_profile_rules_policy.apply(tax_profile);
    return this.tax_profile_serializer.serialize(
      await this.tax_profiles_repository.save(tax_profile),
    );
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
