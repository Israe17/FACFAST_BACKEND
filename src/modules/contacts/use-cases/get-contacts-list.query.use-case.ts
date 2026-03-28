import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactView } from '../contracts/contact.view';
import { ContactLifecyclePolicy } from '../policies/contact-lifecycle.policy';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactSerializer } from '../serializers/contact.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type GetContactsListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetContactsListQueryUseCase
  implements QueryUseCase<GetContactsListQuery, ContactView[]>
{
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_lifecycle_policy: ContactLifecyclePolicy,
    private readonly contact_serializer: ContactSerializer,
  ) {}

  async execute({
    current_user,
  }: GetContactsListQuery): Promise<ContactView[]> {
    const business_id = resolve_effective_business_id(current_user);
    const contacts =
      await this.contacts_repository.find_all_by_business(business_id);

    return Promise.all(
      contacts.map(async (contact) => {
        const dependencies =
          await this.contacts_validation_service.count_contact_delete_dependencies(
            business_id,
            contact.id,
          );
        return this.contact_serializer.serialize(
          contact,
          this.contact_lifecycle_policy.build_lifecycle(contact, dependencies),
        );
      }),
    );
  }
}
