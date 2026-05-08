import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { OutboxEvent } from '../../common/entities/outbox-event.entity';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { BusinessSequenceService } from '../../common/services/business-sequence.service';
import { ElectronicDocument } from '../entities/electronic-document.entity';
import { HaciendaStatus } from '../enums/hacienda-status.enum';
import { ElectronicDocumentLifecyclePolicy } from '../policies/electronic-document-lifecycle.policy';
import { ElectronicDocumentsRepository } from '../repositories/electronic-documents.repository';

const ELECTRONIC_DOCUMENT_CONSECUTIVE_SCOPE =
  'electronic_document_consecutive';

export type ProcessElectronicDocumentEmissionOutboxCommand = {
  manager: EntityManager;
  outbox_event: OutboxEvent;
};

/**
 * STUB — does not actually submit to Hacienda yet.
 *
 * Today this use-case marks the document as SUBMITTED locally. The real
 * Hacienda submission flow still needs:
 *
 * 1. **Document key (50 chars)**: build_document_key currently returns a
 *    placeholder. Hacienda format is:
 *      [3]country=506 + [2]day + [2]month + [2]year +
 *      [12]emisor_identification + [3]branch + [5]terminal + [2]doctype +
 *      [10]sequence + [1]situation + [8]security_code
 *
 * 2. **XML 4.4**: build_placeholder_xml needs to be replaced with a real
 *    generator that matches the official XSD for FacturaElectronica /
 *    TiqueteElectronico / NotaCredito / NotaDebito. Includes Emisor,
 *    Receptor (skip when is_final_consumer), DetalleServicio (one per
 *    line with CABYS, IVA breakdown), ResumenFactura, NormativaReferencia.
 *
 * 3. **XML signing**: Hacienda requires XAdES-BES signature using the
 *    business's certificate (cryptographic key + password from the
 *    Llave Criptográfica issued by Hacienda). Suggested lib: xml-crypto.
 *    Certificates need encrypted storage per business.
 *
 * 4. **TRIBU-CR OAuth**: get token from
 *    idp.comprobanteselectronicos.go.cr/auth/realms/rut-stag/protocol/openid-connect/token
 *    using the business's user/password.
 *
 * 5. **Submission**: POST to
 *    api.comprobanteselectronicos.go.cr/recepcion/v1/recepcion with the
 *    signed XML. Response is async — Hacienda accepts/rejects later via
 *    GET /recepcion/v1/recepcion/{clave}/estado.
 *
 * 6. **Status polling / webhook**: separate worker that polls accepted /
 *    rejected documents and updates hacienda_status + hacienda_message.
 */
@Injectable()
export class ProcessElectronicDocumentEmissionOutboxUseCase
  implements
    CommandUseCase<ProcessElectronicDocumentEmissionOutboxCommand, void>
{
  constructor(
    private readonly electronic_documents_repository: ElectronicDocumentsRepository,
    private readonly electronic_document_lifecycle_policy: ElectronicDocumentLifecyclePolicy,
    private readonly business_sequence_service: BusinessSequenceService,
  ) {}

  async execute({
    manager,
    outbox_event,
  }: ProcessElectronicDocumentEmissionOutboxCommand): Promise<void> {
    const business_id = outbox_event.business_id;
    const electronic_document_id = Number(
      outbox_event.payload?.electronic_document_id,
    );

    if (!business_id || !Number.isInteger(electronic_document_id)) {
      throw new DomainBadRequestException({
        code: 'OUTBOX_EVENT_PAYLOAD_INVALID',
        messageKey: 'common.outbox_event_payload_invalid',
        details: {
          outbox_event_id: outbox_event.id,
          event_name: outbox_event.event_name,
        },
      });
    }

    const document =
      await this.electronic_documents_repository.find_by_id_in_business_for_update(
        manager,
        electronic_document_id,
        business_id,
      );
    if (!document) {
      throw new DomainNotFoundException({
        code: 'ELECTRONIC_DOCUMENT_NOT_FOUND',
        messageKey: 'sales.electronic_document_not_found',
        details: {
          electronic_document_id,
        },
      });
    }

    if (
      document.hacienda_status === HaciendaStatus.SUBMITTED ||
      document.hacienda_status === HaciendaStatus.ACCEPTED
    ) {
      return;
    }

    this.electronic_document_lifecycle_policy.assert_submittable(document);

    if (!document.consecutive) {
      const next_value = await this.business_sequence_service.next_value(
        manager,
        business_id,
        ELECTRONIC_DOCUMENT_CONSECUTIVE_SCOPE,
      );
      document.consecutive = next_value.toString().padStart(20, '0');
    }

    if (!document.document_key) {
      document.document_key = this.build_document_key(document);
    }

    if (!document.xml_content) {
      document.xml_content = this.build_placeholder_xml(document);
    }

    document.hacienda_status = HaciendaStatus.SUBMITTED;
    document.submitted_at = new Date();
    document.hacienda_message = 'Prepared and queued for Hacienda submission.';

    await manager.getRepository(ElectronicDocument).save(document);
  }

  private build_document_key(document: ElectronicDocument): string {
    const business_segment = document.business_id.toString().padStart(6, '0');
    const date_segment = document.emission_date
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, '');
    const consecutive_segment =
      document.consecutive ?? document.id.toString().padStart(20, '0');
    return `ED-${business_segment}-${date_segment}-${consecutive_segment}`.slice(
      0,
      50,
    );
  }

  private build_placeholder_xml(document: ElectronicDocument): string {
    return [
      '<electronicDocument>',
      `  <documentId>${document.id}</documentId>`,
      `  <documentType>${document.document_type}</documentType>`,
      `  <documentKey>${document.document_key ?? ''}</documentKey>`,
      `  <consecutive>${document.consecutive ?? ''}</consecutive>`,
      `  <saleOrderId>${document.sale_order_id ?? ''}</saleOrderId>`,
      `  <receiverName>${this.escape_xml(document.receiver_name)}</receiverName>`,
      `  <currency>${document.currency}</currency>`,
      `  <subtotal>${Number(document.subtotal).toFixed(2)}</subtotal>`,
      `  <taxTotal>${Number(document.tax_total).toFixed(2)}</taxTotal>`,
      `  <discountTotal>${Number(document.discount_total).toFixed(2)}</discountTotal>`,
      `  <total>${Number(document.total).toFixed(2)}</total>`,
      '</electronicDocument>',
    ].join('\n');
  }

  private escape_xml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
