import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactView } from '../contracts/contact.view';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactSerializer } from '../serializers/contact.serializer';

export type GetContactsListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetContactsListQueryUseCase
  implements QueryUseCase<GetContactsListQuery, ContactView[]>
{
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contact_serializer: ContactSerializer,
  ) {}

  async execute({
    current_user,
  }: GetContactsListQuery): Promise<ContactView[]> {
    const contacts = await this.contacts_repository.find_all_by_business(
      resolve_effective_business_id(current_user),
    );

    return contacts.map((contact) => this.contact_serializer.serialize(contact));
  }
}
