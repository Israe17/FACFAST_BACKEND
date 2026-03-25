import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { ElectronicDocumentView } from '../contracts/electronic-document.view';
import { ElectronicDocument } from '../entities/electronic-document.entity';
import { HaciendaStatus } from '../enums/hacienda-status.enum';

@Injectable()
export class ElectronicDocumentSerializer
  implements EntitySerializer<ElectronicDocument, ElectronicDocumentView>
{
  serialize(document: ElectronicDocument): ElectronicDocumentView {
    const can_resubmit =
      document.hacienda_status === HaciendaStatus.ERROR ||
      document.hacienda_status === HaciendaStatus.REJECTED;

    return {
      id: document.id,
      code: document.code,
      business_id: document.business_id,
      branch_id: document.branch_id,
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
      submitted_at: document.submitted_at,
      accepted_at: document.accepted_at,
      sale_order: document.sale_order
        ? {
            id: document.sale_order.id,
            code: document.sale_order.code,
          }
        : null,
      branch: document.branch
        ? {
            id: document.branch.id,
            name: document.branch.name,
          }
        : null,
      lifecycle: {
        can_resubmit,
        reasons: can_resubmit ? [] : ['not_rejected_or_failed'],
      },
      assets: {
        has_xml: document.xml_content !== null,
        has_pdf: document.pdf_path !== null,
      },
      created_at: document.created_at,
      updated_at: document.updated_at,
    };
  }
}
