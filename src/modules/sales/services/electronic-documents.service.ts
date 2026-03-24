import { Injectable } from '@nestjs/common';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { CreateElectronicDocumentDto } from '../dto/create-electronic-document.dto';
import { ElectronicDocument } from '../entities/electronic-document.entity';
import { HaciendaStatus } from '../enums/hacienda-status.enum';
import { ElectronicDocumentsRepository } from '../repositories/electronic-documents.repository';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';

@Injectable()
export class ElectronicDocumentsService {
  constructor(
    private readonly electronic_documents_repository: ElectronicDocumentsRepository,
    private readonly sale_orders_repository: SaleOrdersRepository,
  ) {}

  async get_documents(current_user: AuthenticatedUserContext) {
    const business_id = resolve_effective_business_id(current_user);
    const documents =
      await this.electronic_documents_repository.find_all_by_business(
        business_id,
      );
    return documents.map((doc) => this.serialize_document(doc));
  }

  async get_documents_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    return this.electronic_documents_repository.find_paginated_by_business(
      resolve_effective_business_id(current_user),
      query,
      (document) => this.serialize_document(document),
    );
  }

  async get_document(
    current_user: AuthenticatedUserContext,
    document_id: number,
  ) {
    const business_id = resolve_effective_business_id(current_user);
    const document =
      await this.electronic_documents_repository.find_by_id_in_business(
        document_id,
        business_id,
      );
    if (!document) {
      throw new DomainNotFoundException({
        code: 'ELECTRONIC_DOCUMENT_NOT_FOUND',
        messageKey: 'sales.electronic_document_not_found',
        details: { document_id },
      });
    }
    return this.serialize_document(document);
  }

  async emit_document(
    current_user: AuthenticatedUserContext,
    dto: CreateElectronicDocumentDto,
  ) {
    const business_id = resolve_effective_business_id(current_user);

    const sale_order =
      await this.sale_orders_repository.find_by_id_in_business(
        dto.sale_order_id,
        business_id,
      );
    if (!sale_order) {
      throw new DomainNotFoundException({
        code: 'SALE_ORDER_NOT_FOUND',
        messageKey: 'sales.order_not_found',
        details: { order_id: dto.sale_order_id },
      });
    }

    const lines = sale_order.lines ?? [];
    let subtotal = 0;
    let tax_total = 0;
    let discount_total = 0;

    for (const line of lines) {
      const line_subtotal = line.quantity * line.unit_price;
      const line_discount = line_subtotal * (line.discount_percent / 100);
      subtotal += line_subtotal;
      tax_total += line.tax_amount;
      discount_total += line_discount;
    }

    const total = subtotal - discount_total + tax_total;

    const document = this.electronic_documents_repository.create({
      business_id,
      branch_id: sale_order.branch_id,
      sale_order_id: sale_order.id,
      document_type: dto.document_type,
      document_key: null,
      consecutive: null,
      emission_date: new Date(),
      currency: 'CRC',
      subtotal,
      tax_total,
      discount_total,
      total,
      receiver_name: dto.receiver_name ?? sale_order.customer_contact?.name ?? '',
      receiver_identification_type: dto.receiver_identification_type ?? null,
      receiver_identification_number: dto.receiver_identification_number ?? null,
      receiver_email: dto.receiver_email ?? null,
      hacienda_status: HaciendaStatus.PENDING,
      hacienda_response_xml: null,
      hacienda_message: null,
      submitted_at: null,
      accepted_at: null,
      xml_content: null,
      pdf_path: null,
    });

    const saved_document =
      await this.electronic_documents_repository.save(document);

    const full_document =
      await this.electronic_documents_repository.find_by_id_in_business(
        saved_document.id,
        business_id,
      );
    return this.serialize_document(full_document!);
  }

  private serialize_document(document: ElectronicDocument) {
    return {
      id: document.id,
      code: document.code,
      document_type: document.document_type,
      document_key: document.document_key,
      consecutive: document.consecutive,
      emission_date: document.emission_date,
      currency: document.currency,
      subtotal: document.subtotal,
      tax_total: document.tax_total,
      discount_total: document.discount_total,
      total: document.total,
      receiver_name: document.receiver_name,
      receiver_identification_type: document.receiver_identification_type,
      receiver_identification_number: document.receiver_identification_number,
      receiver_email: document.receiver_email,
      hacienda_status: document.hacienda_status,
      hacienda_message: document.hacienda_message,
      sale_order: document.sale_order
        ? { id: document.sale_order.id, code: document.sale_order.code }
        : null,
      branch: document.branch
        ? { id: document.branch.id, name: document.branch.name }
        : undefined,
      lifecycle: {
        can_resubmit:
          document.hacienda_status === HaciendaStatus.ERROR ||
          document.hacienda_status === HaciendaStatus.REJECTED,
      },
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
