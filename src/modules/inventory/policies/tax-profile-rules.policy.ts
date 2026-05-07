import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxType } from '../enums/tax-type.enum';

@Injectable()
export class TaxProfileRulesPolicy {
  apply(tax_profile: TaxProfile): void {
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
}
