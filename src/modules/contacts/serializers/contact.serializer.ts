import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { ContactView } from '../contracts/contact.view';
import { Contact } from '../entities/contact.entity';
import { ContactLifecyclePolicy } from '../policies/contact-lifecycle.policy';

@Injectable()
export class ContactSerializer implements EntitySerializer<Contact, ContactView> {
  constructor(
    private readonly contact_lifecycle_policy: ContactLifecyclePolicy,
  ) {}

  serialize(
    contact: Contact,
    lifecycle = this.contact_lifecycle_policy.build_lifecycle(contact),
  ): ContactView {
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
      delivery_latitude: contact.delivery_latitude ?? null,
      delivery_longitude: contact.delivery_longitude ?? null,
      tax_condition: contact.tax_condition,
      economic_activity_code: contact.economic_activity_code,
      is_active: contact.is_active,
      exoneration_type: contact.exoneration_type,
      exoneration_document_number: contact.exoneration_document_number,
      exoneration_institution: contact.exoneration_institution,
      exoneration_issue_date: contact.exoneration_issue_date,
      exoneration_percentage: contact.exoneration_percentage,
      lifecycle,
      created_at: contact.created_at,
      updated_at: contact.updated_at,
    };
  }
}
