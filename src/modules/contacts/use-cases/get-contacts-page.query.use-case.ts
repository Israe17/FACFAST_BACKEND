import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ContactView } from '../contracts/contact.view';
import { ContactsRepository } from '../repositories/contacts.repository';
import { ContactSerializer } from '../serializers/contact.serializer';

export type GetContactsPageQuery = {
  current_user: AuthenticatedUserContext;
  query: PaginatedQueryDto;
};

@Injectable()
export class GetContactsPageQueryUseCase
  implements QueryUseCase<GetContactsPageQuery, PaginatedResponseDto<ContactView>>
{
  constructor(
    private readonly contacts_repository: ContactsRepository,
    private readonly contact_serializer: ContactSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetContactsPageQuery): Promise<PaginatedResponseDto<ContactView>> {
    return this.contacts_repository.find_paginated_by_business(
      resolve_effective_business_id(current_user),
      query,
      (contact) => this.contact_serializer.serialize(contact),
    ) as Promise<PaginatedResponseDto<ContactView>>;
  }
}
