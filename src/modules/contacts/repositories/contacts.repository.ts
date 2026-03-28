import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { EntityCodeService } from '../../common/services/entity-code.service';
import {
  apply_pagination,
  apply_search,
  apply_sorting,
} from '../../common/utils/query-builder.util';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { Contact } from '../entities/contact.entity';

const CONTACT_SORT_COLUMNS: Record<string, string> = {
  name: 'contact.name',
  code: 'contact.code',
  identification_number: 'contact.identification_number',
  type: 'contact.type',
  created_at: 'contact.created_at',
  updated_at: 'contact.updated_at',
};

const CONTACT_SEARCH_COLUMNS = [
  'contact.name',
  'contact.code',
  'contact.identification_number',
  'contact.email',
  'contact.phone',
  'contact.commercial_name',
];

@Injectable()
export class ContactsRepository {
  constructor(
    @InjectRepository(Contact)
    private readonly contact_repository: Repository<Contact>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<Contact>): Contact {
    return this.contact_repository.create(payload);
  }

  async save(contact: Contact): Promise<Contact> {
    const saved_contact = await this.contact_repository.save(contact);
    return this.entity_code_service.ensure_code(
      this.contact_repository,
      saved_contact,
      'CT',
    );
  }

  async remove(contact: Contact): Promise<void> {
    await this.contact_repository.remove(contact);
  }

  async find_all_by_business(business_id: number): Promise<Contact[]> {
    return this.contact_repository.find({
      where: {
        business_id,
      },
      order: {
        name: 'ASC',
        id: 'ASC',
      },
    });
  }

  async find_paginated_by_business(
    business_id: number,
    query: PaginatedQueryDto,
    mapper: (contact: Contact) => unknown | Promise<unknown>,
  ): Promise<PaginatedResponseDto<unknown>> {
    const qb = this.contact_repository
      .createQueryBuilder('contact')
      .where('contact.business_id = :business_id', { business_id });

    apply_search(qb, query.search, CONTACT_SEARCH_COLUMNS);
    apply_sorting(
      qb,
      query.sort_by,
      query.sort_order,
      CONTACT_SORT_COLUMNS,
      'contact.name',
      'ASC',
    );

    return apply_pagination(qb, query, mapper);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<Contact | null> {
    return this.contact_repository.findOne({
      where: {
        id,
        business_id,
      },
    });
  }

  async find_many_by_identification_number_in_business(
    business_id: number,
    identification_number: string,
  ): Promise<Contact[]> {
    return this.contact_repository.find({
      where: {
        business_id,
        identification_number,
      },
      order: {
        name: 'ASC',
        id: 'ASC',
      },
    });
  }

  async exists_code(
    business_id: number,
    code: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.contact_repository
      .createQueryBuilder('contact')
      .where('contact.business_id = :business_id', { business_id })
      .andWhere('contact.code = :code', { code });

    if (exclude_id !== undefined) {
      query.andWhere('contact.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }

  async exists_identification_in_business(
    business_id: number,
    identification_type: ContactIdentificationType,
    identification_number: string,
    exclude_id?: number,
  ): Promise<boolean> {
    const query = this.contact_repository
      .createQueryBuilder('contact')
      .where('contact.business_id = :business_id', { business_id })
      .andWhere('contact.identification_type = :identification_type', {
        identification_type,
      })
      .andWhere('contact.identification_number = :identification_number', {
        identification_number,
      });

    if (exclude_id !== undefined) {
      query.andWhere('contact.id != :exclude_id', { exclude_id });
    }

    return (await query.getCount()) > 0;
  }
}
