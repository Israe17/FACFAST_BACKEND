import { Injectable, Logger } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { isWithinCostaRica } from '../../common/utils/geo.utils';
import { ContactView } from '../contracts/contact.view';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactLifecyclePolicy } from '../policies/contact-lifecycle.policy';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactSerializer } from '../serializers/contact.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type UpdateContactCommand = {
  current_user: AuthenticatedUserContext;
  contact_id: number;
  dto: UpdateContactDto;
};

@Injectable()
export class UpdateContactUseCase
  implements CommandUseCase<UpdateContactCommand, ContactView>
{
  private readonly logger = new Logger(UpdateContactUseCase.name);

  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly entity_code_service: EntityCodeService,
    private readonly contact_lifecycle_policy: ContactLifecyclePolicy,
    private readonly contact_serializer: ContactSerializer,
    private readonly geocoding_service: GeocodingService,
  ) {}

  async execute({
    current_user,
    contact_id,
    dto,
  }: UpdateContactCommand): Promise<ContactView> {
    const business_id = resolve_effective_business_id(current_user);
    const contact = await this.contacts_validation_service.get_contact_in_business(
      business_id,
      contact_id,
    );

    if (dto.code !== undefined) {
      const code = this.normalize_code(dto.code);
      if (code) {
        this.entity_code_service.validate_code('CT', code);
        await this.assert_code_available(business_id, code, contact.id);
      }
      contact.code = code;
    }

    const next_identification_type =
      dto.identification_type ?? contact.identification_type;
    const next_identification_number =
      dto.identification_number?.trim() ?? contact.identification_number;

    if (
      dto.identification_type !== undefined ||
      dto.identification_number !== undefined
    ) {
      await this.assert_identification_available(
        business_id,
        next_identification_type,
        next_identification_number,
        contact.id,
      );
    }

    if (dto.type) {
      contact.type = dto.type;
    }
    if (dto.name) {
      contact.name = dto.name.trim();
    }
    if (dto.commercial_name !== undefined) {
      contact.commercial_name = this.normalize_optional_string(
        dto.commercial_name,
      );
    }
    if (dto.identification_type) {
      contact.identification_type = dto.identification_type;
    }
    if (dto.identification_number) {
      contact.identification_number = dto.identification_number.trim();
    }
    if (dto.email !== undefined) {
      contact.email = this.normalize_email(dto.email);
    }
    if (dto.phone !== undefined) {
      contact.phone = this.normalize_optional_string(dto.phone);
    }
    if (dto.address !== undefined) {
      contact.address = this.normalize_optional_string(dto.address);
    }
    if (dto.province !== undefined) {
      contact.province = this.normalize_optional_string(dto.province);
    }
    if (dto.canton !== undefined) {
      contact.canton = this.normalize_optional_string(dto.canton);
    }
    if (dto.district !== undefined) {
      contact.district = this.normalize_optional_string(dto.district);
    }
    if (dto.tax_condition !== undefined) {
      contact.tax_condition = this.normalize_optional_string(dto.tax_condition);
    }
    if (dto.economic_activity_code !== undefined) {
      contact.economic_activity_code = this.normalize_optional_string(
        dto.economic_activity_code,
      );
    }
    if (dto.is_active !== undefined) {
      contact.is_active = dto.is_active;
    }
    if (dto.exoneration_type !== undefined) {
      contact.exoneration_type = this.normalize_optional_string(
        dto.exoneration_type,
      );
    }
    if (dto.exoneration_document_number !== undefined) {
      contact.exoneration_document_number = this.normalize_optional_string(
        dto.exoneration_document_number,
      );
    }
    if (dto.exoneration_institution !== undefined) {
      contact.exoneration_institution = this.normalize_optional_string(
        dto.exoneration_institution,
      );
    }
    if (dto.exoneration_issue_date !== undefined) {
      contact.exoneration_issue_date = this.normalize_optional_string(
        dto.exoneration_issue_date,
      );
    }
    if (dto.exoneration_percentage !== undefined) {
      contact.exoneration_percentage = dto.exoneration_percentage;
    }

    if (
      dto.delivery_latitude !== undefined &&
      dto.delivery_longitude !== undefined
    ) {
      if (!isWithinCostaRica(dto.delivery_latitude, dto.delivery_longitude)) {
        throw new DomainBadRequestException({
          code: 'COORDINATES_OUTSIDE_COSTA_RICA',
          messageKey: 'contacts.coordinates_outside_costa_rica',
          details: {
            delivery_latitude: dto.delivery_latitude,
            delivery_longitude: dto.delivery_longitude,
          },
        });
      }
      contact.delivery_latitude = dto.delivery_latitude;
      contact.delivery_longitude = dto.delivery_longitude;
    }

    const address_changed =
      dto.address !== undefined ||
      dto.district !== undefined ||
      dto.canton !== undefined ||
      dto.province !== undefined;

    const saved_contact = await this.contacts_repository.save(contact);

    if (address_changed && saved_contact.delivery_latitude === null) {
      this.geocoding_service
        .geocode({
          address: saved_contact.address,
          district: saved_contact.district,
          canton: saved_contact.canton,
          province: saved_contact.province,
        })
        .then((result) => {
          if (result) {
            saved_contact.delivery_latitude = result.latitude;
            saved_contact.delivery_longitude = result.longitude;
            return this.contacts_repository.save(saved_contact);
          }
        })
        .catch((error) => {
          this.logger.warn(
            `Geocoding failed for contact ${saved_contact.id}: ${error instanceof Error ? error.message : String(error)}`,
          );
        });
    }

    const dependencies =
      await this.contacts_validation_service.count_contact_delete_dependencies(
        business_id,
        saved_contact.id,
      );
    return this.contact_serializer.serialize(
      saved_contact,
      this.contact_lifecycle_policy.build_lifecycle(
        saved_contact,
        dependencies,
      ),
    );
  }

  private async assert_code_available(
    business_id: number,
    code: string,
    exclude_id?: number,
  ): Promise<void> {
    if (
      await this.contacts_repository.exists_code(business_id, code, exclude_id)
    ) {
      throw new DomainConflictException({
        code: 'CONTACT_CODE_DUPLICATE',
        messageKey: 'contacts.code_duplicate',
        details: {
          field: 'code',
        },
      });
    }
  }

  private async assert_identification_available(
    business_id: number,
    identification_type: ContactIdentificationType,
    identification_number: string,
    exclude_id?: number,
  ): Promise<void> {
    if (
      await this.contacts_repository.exists_identification_in_business(
        business_id,
        identification_type,
        identification_number,
        exclude_id,
      )
    ) {
      throw new DomainConflictException({
        code: 'CONTACT_IDENTIFICATION_DUPLICATE',
        messageKey: 'contacts.identification_duplicate',
        details: {
          field: 'identification_number',
          identification_type,
        },
      });
    }
  }

  private normalize_code(code?: string): string | null {
    const normalized = code?.trim();
    return normalized ? normalized : null;
  }

  private normalize_email(email?: string): string | null {
    const normalized = this.normalize_optional_string(email);
    return normalized ? normalized.toLowerCase() : null;
  }

  private normalize_optional_string(value?: string | null): string | null {
    const normalized = value?.trim();
    return normalized ? normalized : null;
  }
}
