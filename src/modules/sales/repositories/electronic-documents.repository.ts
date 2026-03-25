import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { EntityCodeService } from '../../common/services/entity-code.service';
import {
  apply_cursor,
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
    return this.find_all_by_business_in_scope(business_id);
  }

  async find_all_by_business_in_scope(
    business_id: number,
    branch_ids?: number[],
  ): Promise<ElectronicDocument[]> {
    if (branch_ids && branch_ids.length === 0) {
      return [];
    }

    return this.electronic_document_repository.find({
      where: {
        business_id,
        ...(branch_ids?.length ? { branch_id: In(branch_ids) } : {}),
      },
      relations: DOCUMENT_RELATIONS,
      order: { created_at: 'DESC' },
    });
  }

  async find_paginated_by_business<R>(
    business_id: number,
    query: PaginatedQueryDto,
    mapper: (document: ElectronicDocument) => R,
    branch_ids?: number[],
  ): Promise<PaginatedResponseDto<R>> {
    const qb = this.electronic_document_repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.sale_order', 'sale_order')
      .leftJoinAndSelect('document.branch', 'branch')
      .where('document.business_id = :business_id', { business_id });

    if (branch_ids && branch_ids.length === 0) {
      qb.andWhere('1 = 0');
    } else if (branch_ids?.length) {
      qb.andWhere('document.branch_id IN (:...branch_ids)', { branch_ids });
    }

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

  async find_cursor_by_business<R>(
    business_id: number,
    query: CursorQueryDto,
    mapper: (document: ElectronicDocument) => R,
    branch_ids?: number[],
  ): Promise<CursorResponseDto<R>> {
    const qb = this.electronic_document_repository
      .createQueryBuilder('document')
      .leftJoinAndSelect('document.sale_order', 'sale_order')
      .leftJoinAndSelect('document.branch', 'branch')
      .where('document.business_id = :business_id', { business_id });

    if (branch_ids && branch_ids.length === 0) {
      qb.andWhere('1 = 0');
    } else if (branch_ids?.length) {
      qb.andWhere('document.branch_id IN (:...branch_ids)', { branch_ids });
    }

    apply_search(qb, query.search, DOCUMENT_SEARCH_COLUMNS);
    qb.orderBy('document.id', query.sort_order ?? 'DESC');

    return apply_cursor(qb, query, 'document.id', mapper);
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

  async find_by_id_in_business_for_update(
    manager: EntityManager,
    id: number,
    business_id: number,
  ): Promise<ElectronicDocument | null> {
    return manager
      .getRepository(ElectronicDocument)
      .createQueryBuilder('document')
      .setLock('pessimistic_write')
      .leftJoinAndSelect('document.sale_order', 'sale_order')
      .leftJoinAndSelect('document.branch', 'branch')
      .where('document.id = :id', { id })
      .andWhere('document.business_id = :business_id', { business_id })
      .getOne();
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

  async find_by_sale_order_id_in_business_for_update(
    manager: EntityManager,
    sale_order_id: number,
    business_id: number,
  ): Promise<ElectronicDocument[]> {
    return manager
      .getRepository(ElectronicDocument)
      .createQueryBuilder('document')
      .setLock('pessimistic_write')
      .leftJoinAndSelect('document.sale_order', 'sale_order')
      .leftJoinAndSelect('document.branch', 'branch')
      .where('document.sale_order_id = :sale_order_id', { sale_order_id })
      .andWhere('document.business_id = :business_id', { business_id })
      .orderBy('document.created_at', 'DESC')
      .getMany();
  }
}
