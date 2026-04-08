import { Injectable, Logger } from '@nestjs/common';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { GeocodingService } from '../../common/services/geocoding.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactView } from '../contracts/contact.view';
import { CreateContactDto } from '../dto/create-contact.dto';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactLifecyclePolicy } from '../policies/contact-lifecycle.policy';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactSerializer } from '../serializers/contact.serializer';

export type CreateContactCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateContactDto;
};

@Injectable()
export class CreateContactUseCase
  implements CommandUseCase<CreateContactCommand, ContactView>
{
  private readonly logger = new Logger(CreateContactUseCase.name);

  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly entity_code_service: EntityCodeService,
    private readonly contact_lifecycle_policy: ContactLifecyclePolicy,
    private readonly contact_serializer: ContactSerializer,
    private readonly geocoding_service: GeocodingService,
  ) {}

  async execute({
    current_user,
    dto,
  }: CreateContactCommand): Promise<ContactView> {
    const business_id = resolve_effective_business_id(current_user);
    const code = this.normalize_code(dto.code);
    if (code) {
      this.entity_code_service.validate_code('CT', code);
      await this.assert_code_available(business_id, code);
    }

    const identification_number = dto.identification_number.trim();
    await this.assert_identification_available(
      business_id,
      dto.identification_type,
      identification_number,
    );

    const contact = this.contacts_repository.create({
      business_id,
      code,
      type: dto.type,
      name: dto.name.trim(),
      commercial_name: this.normalize_optional_string(dto.commercial_name),
      identification_type: dto.identification_type,
      identification_number,
      email: this.normalize_email(dto.email),
      phone: this.normalize_optional_string(dto.phone),
      address: this.normalize_optional_string(dto.address),
      province: this.normalize_optional_string(dto.province),
      canton: this.normalize_optional_string(dto.canton),
      district: this.normalize_optional_string(dto.district),
      tax_condition: this.normalize_optional_string(dto.tax_condition),
      economic_activity_code: this.normalize_optional_string(
        dto.economic_activity_code,
      ),
      is_active: dto.is_active ?? true,
      exoneration_type: this.normalize_optional_string(dto.exoneration_type),
      exoneration_document_number: this.normalize_optional_string(
        dto.exoneration_document_number,
      ),
      exoneration_institution: this.normalize_optional_string(
        dto.exoneration_institution,
      ),
      exoneration_issue_date: this.normalize_optional_string(
        dto.exoneration_issue_date,
      ),
      exoneration_percentage: dto.exoneration_percentage ?? null,
    });

    const saved_contact = await this.contacts_repository.save(contact);

    const has_address_fields =
      saved_contact.address || saved_contact.district || saved_contact.canton || saved_contact.province;

    if (has_address_fields && saved_contact.delivery_latitude === null) {
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

    return this.contact_serializer.serialize(
      saved_contact,
      this.contact_lifecycle_policy.build_lifecycle(saved_contact, {
        inventory_lots: 0,
        serial_events: 0,
      }),
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
