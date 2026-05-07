import { Injectable } from '@nestjs/common';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfileView } from '../contracts/tax-profile.view';

@Injectable()
export class TaxProfileSerializer {
  serialize(tax_profile: TaxProfile): TaxProfileView {
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
      tax_inclusion_mode: tax_profile.tax_inclusion_mode,
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
