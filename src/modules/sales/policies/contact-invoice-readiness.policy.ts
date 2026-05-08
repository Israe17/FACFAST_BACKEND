import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { Contact } from '../../contacts/entities/contact.entity';

@Injectable()
export class ContactInvoiceReadinessPolicy {
  assert_is_invoice_ready(contact: Contact): void {
    if (!contact.email && !contact.phone) {
      throw new DomainBadRequestException({
        code: 'INVOICE_RECEIVER_CONTACT_INCOMPLETE',
        messageKey: 'sales.invoice_readiness.email_or_phone_required',
        details: {
          contact_id: contact.id,
          contact_name: contact.name,
        },
      });
    }
  }
}
