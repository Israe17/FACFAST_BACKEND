import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import {
  resolve_effective_branch_scope_ids,
  resolve_effective_business_id,
} from '../../common/utils/tenant-context.util';
import { ElectronicDocumentView } from '../contracts/electronic-document.view';
import { ElectronicDocumentsRepository } from '../repositories/electronic-documents.repository';
import { ElectronicDocumentSerializer } from '../serializers/electronic-document.serializer';

export type GetElectronicDocumentsListQuery = {
  current_user: AuthenticatedUserContext;
};

@Injectable()
export class GetElectronicDocumentsListQueryUseCase
  implements
    QueryUseCase<GetElectronicDocumentsListQuery, ElectronicDocumentView[]>
{
  constructor(
    private readonly electronic_documents_repository: ElectronicDocumentsRepository,
    private readonly electronic_document_serializer: ElectronicDocumentSerializer,
  ) {}

  async execute({
    current_user,
  }: GetElectronicDocumentsListQuery): Promise<ElectronicDocumentView[]> {
    const documents =
      await this.electronic_documents_repository.find_all_by_business_in_scope(
        resolve_effective_business_id(current_user),
        resolve_effective_branch_scope_ids(current_user),
      );

    return documents.map((document) =>
      this.electronic_document_serializer.serialize(document),
    );
  }
}
