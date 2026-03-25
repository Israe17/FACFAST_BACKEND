import { Injectable } from '@nestjs/common';
import { QueryUseCase } from '../../common/application/interfaces/query-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ElectronicDocumentView } from '../contracts/electronic-document.view';
import { ElectronicDocumentAccessPolicy } from '../policies/electronic-document-access.policy';
import { ElectronicDocumentsRepository } from '../repositories/electronic-documents.repository';
import { ElectronicDocumentSerializer } from '../serializers/electronic-document.serializer';

export type GetElectronicDocumentQuery = {
  current_user: AuthenticatedUserContext;
  electronic_document_id: number;
};

@Injectable()
export class GetElectronicDocumentQueryUseCase
  implements QueryUseCase<GetElectronicDocumentQuery, ElectronicDocumentView>
{
  constructor(
    private readonly electronic_documents_repository: ElectronicDocumentsRepository,
    private readonly electronic_document_access_policy: ElectronicDocumentAccessPolicy,
    private readonly electronic_document_serializer: ElectronicDocumentSerializer,
  ) {}

  async execute({
    current_user,
    electronic_document_id,
  }: GetElectronicDocumentQuery): Promise<ElectronicDocumentView> {
    const document =
      await this.electronic_documents_repository.find_by_id_in_business(
        electronic_document_id,
        resolve_effective_business_id(current_user),
      );
    if (!document) {
      throw new DomainNotFoundException({
        code: 'ELECTRONIC_DOCUMENT_NOT_FOUND',
        messageKey: 'sales.electronic_document_not_found',
        details: { electronic_document_id },
      });
    }

    this.electronic_document_access_policy.assert_can_access_document(
      current_user,
      document,
    );
    return this.electronic_document_serializer.serialize(document);
  }
}
