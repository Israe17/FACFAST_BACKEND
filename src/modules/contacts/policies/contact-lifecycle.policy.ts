import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

type ContactDeleteDependencies = {
  inventory_lots: number;
  serial_events: number;
};

@Injectable()
export class ContactLifecyclePolicy {
  assert_deletable(
    contact: { id: number },
    dependencies: ContactDeleteDependencies,
  ): void {
    if (dependencies.inventory_lots > 0 || dependencies.serial_events > 0) {
      throw new DomainBadRequestException({
        code: 'CONTACT_DELETE_FORBIDDEN',
        messageKey: 'contacts.delete_forbidden',
        details: {
          contact_id: contact.id,
          dependencies,
        },
      });
    }
  }
}
