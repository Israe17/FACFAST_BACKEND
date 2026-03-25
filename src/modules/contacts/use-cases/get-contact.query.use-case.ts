import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactView } from '../contracts/contact.view';
import { ContactSerializer } from '../serializers/contact.serializer';
import { ContactsValidationService } from '../services/contacts-validation.service';

export type GetContactQuery = {
  current_user: AuthenticatedUserContext;
  contact_id: number;
};

@Injectable()
export class GetContactQueryUseCase
  implements QueryUseCase<GetContactQuery, ContactView>
{
  constructor(
    private readonly contacts_validation_service: ContactsValidationService,
    private readonly contact_serializer: ContactSerializer,
  ) {}

  async execute({
    current_user,
    contact_id,
  }: GetContactQuery): Promise<ContactView> {
    const contact = await this.contacts_validation_service.get_contact_in_business(
      resolve_effective_business_id(current_user),
      contact_id,
    );

    return this.contact_serializer.serialize(contact);
  }
}
