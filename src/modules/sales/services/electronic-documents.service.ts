import { Injectable } from '@nestjs/common';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { PaginatedQueryDto } from '../../common/dto/paginated-query.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { ElectronicDocumentView } from '../contracts/electronic-document.view';
import { CreateElectronicDocumentDto } from '../dto/create-electronic-document.dto';
import { EmitElectronicDocumentUseCase } from '../use-cases/emit-electronic-document.use-case';
import { GetElectronicDocumentQueryUseCase } from '../use-cases/get-electronic-document.query.use-case';
import { GetElectronicDocumentsCursorQueryUseCase } from '../use-cases/get-electronic-documents-cursor.query.use-case';
import { GetElectronicDocumentsListQueryUseCase } from '../use-cases/get-electronic-documents-list.query.use-case';
import { GetElectronicDocumentsPageQueryUseCase } from '../use-cases/get-electronic-documents-page.query.use-case';

@Injectable()
export class ElectronicDocumentsService {
  constructor(
    private readonly get_electronic_documents_list_query_use_case: GetElectronicDocumentsListQueryUseCase,
    private readonly get_electronic_documents_page_query_use_case: GetElectronicDocumentsPageQueryUseCase,
    private readonly get_electronic_documents_cursor_query_use_case: GetElectronicDocumentsCursorQueryUseCase,
    private readonly get_electronic_document_query_use_case: GetElectronicDocumentQueryUseCase,
    private readonly emit_electronic_document_use_case: EmitElectronicDocumentUseCase,
  ) {}

  async get_documents(
    current_user: AuthenticatedUserContext,
  ): Promise<ElectronicDocumentView[]> {
    return this.get_electronic_documents_list_query_use_case.execute({
      current_user,
    });
  }

  async get_documents_paginated(
    current_user: AuthenticatedUserContext,
    query: PaginatedQueryDto,
  ) {
    return this.get_electronic_documents_page_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_documents_cursor(
    current_user: AuthenticatedUserContext,
    query: CursorQueryDto,
  ): Promise<CursorResponseDto<ElectronicDocumentView>> {
    return this.get_electronic_documents_cursor_query_use_case.execute({
      current_user,
      query,
    });
  }

  async get_document(
    current_user: AuthenticatedUserContext,
    electronic_document_id: number,
  ): Promise<ElectronicDocumentView> {
    return this.get_electronic_document_query_use_case.execute({
      current_user,
      electronic_document_id,
    });
  }

  async emit_document(
    current_user: AuthenticatedUserContext,
    dto: CreateElectronicDocumentDto,
    idempotency_key?: string | null,
  ): Promise<ElectronicDocumentView> {
    return this.emit_electronic_document_use_case.execute({
      current_user,
      dto,
      idempotency_key,
    });
  }
}
