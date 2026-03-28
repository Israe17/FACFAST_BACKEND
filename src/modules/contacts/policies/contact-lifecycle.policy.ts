import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';

type ContactDeleteDependencies = {
  inventory_lots: number;
  serial_events: number;
};

@Injectable()
export class ContactLifecyclePolicy {
  build_lifecycle(
    contact: { is_active: boolean },
    dependencies?: ContactDeleteDependencies,
  ) {
    const has_dependencies =
      dependencies !== undefined &&
      (dependencies.inventory_lots > 0 || dependencies.serial_events > 0);

    return {
      can_delete: dependencies ? !has_dependencies : false,
      can_deactivate: contact.is_active,
      can_reactivate: !contact.is_active,
      reasons: dependencies
        ? has_dependencies
          ? ['has_dependencies']
          : []
        : ['delete_requires_dependency_check'],
    };
  }

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
