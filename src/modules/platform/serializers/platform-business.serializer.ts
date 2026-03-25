import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { Business } from '../../common/entities/business.entity';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { PlatformBusinessView } from '../contracts/platform-business.view';

@Injectable()
export class PlatformBusinessSerializer
  implements EntitySerializer<Business, PlatformBusinessView>
{
  serialize(business: Business): PlatformBusinessView {
    return {
      id: business.id,
      code: business.code,
      name: business.name,
      legal_name: business.legal_name,
      identification_type:
        business.identification_type ?? IdentificationType.LEGAL,
      identification_number: business.identification_number,
      currency_code: business.currency_code,
      timezone: business.timezone,
      language: business.language,
      email: business.email,
      phone: business.phone,
      website: business.website,
      logo_url: business.logo_url,
      country: business.country,
      province: business.province,
      canton: business.canton,
      district: business.district,
      city: business.city,
      address: business.address,
      postal_code: business.postal_code,
      is_active: business.is_active,
      created_at: business.created_at,
      updated_at: business.updated_at,
    };
  }
}
