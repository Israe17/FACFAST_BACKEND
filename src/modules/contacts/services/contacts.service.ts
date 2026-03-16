import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { EntityCodeService } from '../../common/services/entity-code.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { Contact } from '../entities/contact.entity';
import { ContactsRepository } from '../repositories/contacts.repository';

@Injectable()
export class ContactsService {
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  async get_contacts(current_user: AuthenticatedUserContext) {
    const contacts = await this.contacts_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );
    return contacts.map((contact) => this.serialize_contact(contact));
  }

  async create_contact(
    current_user: AuthenticatedUserContext,
    dto: CreateContactDto,
  ) {
    const code = this.normalize_code(dto.code);
    const business_id = resolve_effective_business_id(current_user);
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

    return this.serialize_contact(await this.contacts_repository.save(contact));
  }

  async get_contact(
    current_user: AuthenticatedUserContext,
    contact_id: number,
  ) {
    const contact = await this.get_contact_entity(current_user, contact_id);
    return this.serialize_contact(contact);
  }

  async update_contact(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    dto: UpdateContactDto,
  ) {
    const contact = await this.get_contact_entity(current_user, contact_id);

    if (dto.code !== undefined) {
      const code = this.normalize_code(dto.code);
      if (code) {
        this.entity_code_service.validate_code('CT', code);
        await this.assert_code_available(
          resolve_effective_business_id(current_user),
          code,
          contact.id,
        );
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
        resolve_effective_business_id(current_user),
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

    return this.serialize_contact(await this.contacts_repository.save(contact));
  }

  async lookup_by_identification(
    current_user: AuthenticatedUserContext,
    identification: string,
  ) {
    const normalized_identification = identification.trim();
    const contacts =
      await this.contacts_repository.find_many_by_identification_number_in_business(
        resolve_effective_business_id(current_user),
        normalized_identification,
      );

    if (!contacts.length) {
      throw new DomainNotFoundException({
        code: 'CONTACT_NOT_FOUND',
        messageKey: 'contacts.not_found',
        details: {
          identification_number: normalized_identification,
        },
      });
    }

    if (contacts.length > 1) {
      throw new DomainBadRequestException({
        code: 'CONTACT_LOOKUP_MULTIPLE',
        messageKey: 'contacts.lookup_multiple',
        details: {
          identification_number: normalized_identification,
        },
      });
    }

    return this.serialize_contact(contacts[0]);
  }

  private async get_contact_entity(
    current_user: AuthenticatedUserContext,
    contact_id: number,
  ): Promise<Contact> {
    const contact = await this.contacts_repository.find_by_id_in_business(
      contact_id,
      resolve_effective_business_id(current_user),
    );
    if (!contact) {
      throw new DomainNotFoundException({
        code: 'CONTACT_NOT_FOUND',
        messageKey: 'contacts.not_found',
        details: {
          contact_id,
        },
      });
    }

    return contact;
  }

  private async assert_code_available(
    business_id: number,
    code: string,
    exclude_id?: number,
  ): Promise<void> {
    if (
      await this.contacts_repository.exists_code(
        business_id,
        code,
        exclude_id,
      )
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

  private serialize_contact(contact: Contact) {
    return {
      id: contact.id,
      code: contact.code,
      business_id: contact.business_id,
      type: contact.type,
      name: contact.name,
      commercial_name: contact.commercial_name,
      identification_type: contact.identification_type,
      identification_number: contact.identification_number,
      email: contact.email,
      phone: contact.phone,
      address: contact.address,
      province: contact.province,
      canton: contact.canton,
      district: contact.district,
      tax_condition: contact.tax_condition,
      economic_activity_code: contact.economic_activity_code,
      is_active: contact.is_active,
      exoneration_type: contact.exoneration_type,
      exoneration_document_number: contact.exoneration_document_number,
      exoneration_institution: contact.exoneration_institution,
      exoneration_issue_date: contact.exoneration_issue_date,
      exoneration_percentage: contact.exoneration_percentage,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
    };
  }
}
