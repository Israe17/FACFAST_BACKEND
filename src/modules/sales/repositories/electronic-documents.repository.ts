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
import { ElectronicDocument } from '../entities/electronic-document.entity';

const DOCUMENT_SORT_COLUMNS: Record<string, string> = {
  code: 'document.code',
  emission_date: 'document.emission_date',
  document_type: 'document.document_type',
  hacienda_status: 'document.hacienda_status',
  total: 'document.total',
  created_at: 'document.created_at',
};

const DOCUMENT_SEARCH_COLUMNS = [
  'document.code',
  'document.document_key',
  'document.consecutive',
  'document.receiver_name',
  'document.receiver_identification_number',
];

const DOCUMENT_RELATIONS = ['sale_order', 'branch'];

@Injectable()
export class ElectronicDocumentsRepository {
  constructor(
    @InjectRepository(ElectronicDocument)
    private readonly electronic_document_repository: Repository<ElectronicDocument>,
    private readonly entity_code_service: EntityCodeService,
  ) {}

  create(payload: Partial<ElectronicDocument>): ElectronicDocument {
    return this.electronic_document_repository.create(payload);
  }

  async save(document: ElectronicDocument): Promise<ElectronicDocument> {
    const saved_document =
      await this.electronic_document_repository.save(document);
    return this.entity_code_service.ensure_code(
      this.electronic_document_repository,
      saved_document,
      'FE',
    );
  }

  async find_all_by_business(
    business_id: number,
  ): Promise<ElectronicDocument[]> {
    return this.electronic_document_repository.find({
      where: { business_id },
      relations: DOCUMENT_RELATIONS,
      order: { created_at: 'DESC' },
    });
  }

  async find_paginated_by_business(
    business_id: number,
    query: PaginatedQueryDto,
    mapper: (document: ElectronicDocument) => unknown,
  ): Promise<PaginatedResponseDto<unknown>> {
    const qb = this.electronic_document_repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.sale_order', 'sale_order')
      .leftJoinAndSelect('document.branch', 'branch')
      .where('document.business_id = :business_id', { business_id });

    apply_search(qb, query.search, DOCUMENT_SEARCH_COLUMNS);
    apply_sorting(
      qb,
      query.sort_by,
      query.sort_order,
      DOCUMENT_SORT_COLUMNS,
      'document.created_at',
      'DESC',
    );

    return apply_pagination(qb, query, mapper);
  }

  async find_by_id_in_business(
    id: number,
    business_id: number,
  ): Promise<ElectronicDocument | null> {
    return this.electronic_document_repository.findOne({
      where: { id, business_id },
      relations: DOCUMENT_RELATIONS,
    });
  }

  async find_by_sale_order_id(
    sale_order_id: number,
    business_id: number,
  ): Promise<ElectronicDocument[]> {
    return this.electronic_document_repository.find({
      where: { sale_order_id, business_id },
      relations: DOCUMENT_RELATIONS,
      order: { created_at: 'DESC' },
    });
  }
}
