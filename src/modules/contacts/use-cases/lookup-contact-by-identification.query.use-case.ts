import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactView } from '../contracts/contact.view';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactSerializer } from '../serializers/contact.serializer';

export type LookupContactByIdentificationQuery = {
  current_user: AuthenticatedUserContext;
  identification: string;
};

@Injectable()
export class LookupContactByIdentificationQueryUseCase
  implements QueryUseCase<LookupContactByIdentificationQuery, ContactView>
{
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contact_serializer: ContactSerializer,
  ) {}

  async execute({
    current_user,
    identification,
  }: LookupContactByIdentificationQuery): Promise<ContactView> {
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

    return this.contact_serializer.serialize(contacts[0]);
  }
}
