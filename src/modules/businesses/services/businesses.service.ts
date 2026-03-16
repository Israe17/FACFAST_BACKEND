import { Injectable } from '@nestjs/common';
import { Business } from '../../common/entities/business.entity';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { BusinessesRepository } from '../repositories/businesses.repository';
import { UpdateCurrentBusinessDto } from '../dto/update-current-business.dto';
import { serialize_business } from '../utils/serialize-business.util';

@Injectable()
export class BusinessesService {
  constructor(
    private readonly businesses_repository: BusinessesRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_current_business(current_user: AuthenticatedUserContext) {
    return this.serialize_business(
      await this.get_business_or_throw(
        resolve_effective_business_id(current_user),
      ),
    );
  }

  async update_current_business(
    current_user: AuthenticatedUserContext,
    dto: UpdateCurrentBusinessDto,
  ) {
    const business = await this.get_business_or_throw(
      resolve_effective_business_id(current_user),
    );

    if (dto.code) {
      this.entity_code_service.validate_code('BS', dto.code.trim());
      business.code = dto.code.trim();
    }
    if (dto.name) {
      business.name = dto.name.trim();
    }
    if (dto.legal_name) {
      business.legal_name = dto.legal_name.trim();
    }
    if (dto.identification_type !== undefined) {
      business.identification_type = dto.identification_type;
    }
    if (dto.identification_number !== undefined) {
      business.identification_number = this.normalize_optional_string(
        dto.identification_number,
      );
    }
    if (dto.currency_code) {
      business.currency_code = dto.currency_code.trim().toUpperCase();
    }
    if (dto.timezone) {
      business.timezone = dto.timezone.trim();
    }
    if (dto.language) {
      business.language = dto.language.trim();
    }
    if (dto.email !== undefined) {
      business.email = this.normalize_optional_string(dto.email);
    }
    if (dto.phone !== undefined) {
      business.phone = this.normalize_optional_string(dto.phone);
    }
    if (dto.website !== undefined) {
      business.website = this.normalize_optional_string(dto.website);
    }
    if (dto.logo_url !== undefined) {
      business.logo_url = this.normalize_optional_string(dto.logo_url);
    }
    if (dto.country !== undefined) {
      business.country = this.normalize_optional_string(dto.country);
    }
    if (dto.province !== undefined) {
      business.province = this.normalize_optional_string(dto.province);
    }
    if (dto.canton !== undefined) {
      business.canton = this.normalize_optional_string(dto.canton);
    }
    if (dto.district !== undefined) {
      business.district = this.normalize_optional_string(dto.district);
    }
    if (dto.city !== undefined) {
      business.city = this.normalize_optional_string(dto.city);
    }
    if (dto.address !== undefined) {
      business.address = this.normalize_optional_string(dto.address);
    }
    if (dto.postal_code !== undefined) {
      business.postal_code = this.normalize_optional_string(dto.postal_code);
    }
    if (dto.is_active !== undefined) {
      business.is_active = dto.is_active;
    }

    return this.serialize_business(
      await this.businesses_repository.save(business),
    );
  }

  private async get_business_or_throw(business_id: number): Promise<Business> {
    const business = await this.businesses_repository.find_by_id(business_id);
    if (!business) {
      throw new DomainNotFoundException({
        code: 'BUSINESS_NOT_FOUND',
        messageKey: 'businesses.not_found',
        details: {
          business_id,
        },
      });
    }

    return business;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }

  private serialize_business(business: Business) {
    return {
      ...serialize_business(business),
      permissions: {
        can_view: true,
        can_update: true,
        required_view_permission: PermissionKey.BUSINESSES_VIEW,
        required_update_permission: PermissionKey.BUSINESSES_UPDATE,
      },
    };
  }
}
