import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { CursorResponseDto } from '../../common/dto/cursor-response.dto';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { ElectronicDocumentView } from '../contracts/electronic-document.view';
import { ElectronicDocumentsRepository } from '../repositories/electronic-documents.repository';
import { ElectronicDocumentSerializer } from '../serializers/electronic-document.serializer';

export type GetElectronicDocumentsCursorQuery = {
  current_user: AuthenticatedUserContext;
  query: CursorQueryDto;
};

@Injectable()
export class GetElectronicDocumentsCursorQueryUseCase
  implements
    QueryUseCase<
      GetElectronicDocumentsCursorQuery,
      CursorResponseDto<ElectronicDocumentView>
    >
{
  constructor(
    private readonly electronic_documents_repository: ElectronicDocumentsRepository,
    private readonly electronic_document_serializer: ElectronicDocumentSerializer,
  ) {}

  async execute({
    current_user,
    query,
  }: GetElectronicDocumentsCursorQuery): Promise<
    CursorResponseDto<ElectronicDocumentView>
  > {
    return this.electronic_documents_repository.find_cursor_by_business(
      resolve_effective_business_id(current_user),
      query,
      (document) => this.electronic_document_serializer.serialize(document),
      resolve_effective_branch_scope_ids(current_user),
    );
  }
}
