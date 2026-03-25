import { Injectable } from '@nestjs/common';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { ContactView } from '../contracts/contact.view';
import { CreateContactDto } from '../dto/create-contact.dto';
import { UpdateContactDto } from '../dto/update-contact.dto';
import { CreateContactUseCase } from '../use-cases/create-contact.use-case';
import {
  DeleteContactResult,
  DeleteContactUseCase,
} from '../use-cases/delete-contact.use-case';
import { GetContactQueryUseCase } from '../use-cases/get-contact.query.use-case';
import { GetContactsListQueryUseCase } from '../use-cases/get-contacts-list.query.use-case';
import { GetContactsPageQueryUseCase } from '../use-cases/get-contacts-page.query.use-case';
import { LookupContactByIdentificationQueryUseCase } from '../use-cases/lookup-contact-by-identification.query.use-case';
import { UpdateContactUseCase } from '../use-cases/update-contact.use-case';

@Injectable()
export class ContactsService {
  constructor(
    private readonly get_contacts_list_query_use_case: GetContactsListQueryUseCase,
    private readonly get_contacts_page_query_use_case: GetContactsPageQueryUseCase,
    private readonly create_contact_use_case: CreateContactUseCase,
    private readonly get_contact_query_use_case: GetContactQueryUseCase,
    private readonly lookup_contact_by_identification_query_use_case: LookupContactByIdentificationQueryUseCase,
    private readonly update_contact_use_case: UpdateContactUseCase,
    private readonly delete_contact_use_case: DeleteContactUseCase,
  ) {}

  async get_contacts(
    current_user: AuthenticatedUserContext,
  ): Promise<ContactView[]> {
    return this.get_contacts_list_query_use_case.execute({ current_user });
  }

  async get_contacts_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ): Promise<PaginatedResponseDto<ContactView>> {
    return this.get_contacts_page_query_use_case.execute({
      current_user,
      query,
    });
  }

  async create_contact(
    current_user: AuthenticatedUserContext,
    dto: CreateContactDto,
  ): Promise<ContactView> {
    return this.create_contact_use_case.execute({ current_user, dto });
  }

  async get_contact(
    current_user: AuthenticatedUserContext,
    contact_id: number,
  ): Promise<ContactView> {
    return this.get_contact_query_use_case.execute({ current_user, contact_id });
  }

  async update_contact(
    current_user: AuthenticatedUserContext,
    contact_id: number,
    dto: UpdateContactDto,
  ): Promise<ContactView> {
    return this.update_contact_use_case.execute({
      current_user,
      contact_id,
      dto,
    });
  }

  async delete_contact(
    current_user: AuthenticatedUserContext,
    contact_id: number,
  ): Promise<DeleteContactResult> {
    return this.delete_contact_use_case.execute({ current_user, contact_id });
  }

  async lookup_by_identification(
    current_user: AuthenticatedUserContext,
    identification: string,
  ): Promise<ContactView> {
    return this.lookup_contact_by_identification_query_use_case.execute({
      current_user,
      identification,
    });
  }
}
