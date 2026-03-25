import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { CommandUseCase } from '../../common/application/interfaces/command-use-case.interface';
import { DomainNotFoundException } from '../../common/errors/exceptions/domain-not-found.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { IdempotencyService } from '../../common/services/idempotency.service';
import { OutboxService } from '../../common/services/outbox.service';
import { resolve_effective_business_id } from '../../common/utils/tenant-context.util';
import { ElectronicDocumentView } from '../contracts/electronic-document.view';
import { CreateElectronicDocumentDto } from '../dto/create-electronic-document.dto';
import { ElectronicDocument } from '../entities/electronic-document.entity';
import { HaciendaStatus } from '../enums/hacienda-status.enum';
import { ElectronicDocumentAccessPolicy } from '../policies/electronic-document-access.policy';
import { ElectronicDocumentLifecyclePolicy } from '../policies/electronic-document-lifecycle.policy';
import { SaleOrderAccessPolicy } from '../policies/sale-order-access.policy';
import { SaleOrdersRepository } from '../repositories/sale-orders.repository';
import { ElectronicDocumentSerializer } from '../serializers/electronic-document.serializer';

const ELECTRONIC_DOCUMENT_EMIT_REQUESTED_EVENT =
  'sales.electronic_document.emit_requested';

export type EmitElectronicDocumentCommand = {
  current_user: AuthenticatedUserContext;
  dto: CreateElectronicDocumentDto;
  idempotency_key?: string | null;
};

@Injectable()
export class EmitElectronicDocumentUseCase
  implements
    CommandUseCase<EmitElectronicDocumentCommand, ElectronicDocumentView>
{
  constructor(
    @InjectDataSource()
    private readonly data_source: DataSource,
    private readonly sale_orders_repository: SaleOrdersRepository,
    private readonly sale_order_access_policy: SaleOrderAccessPolicy,
    private readonly electronic_document_access_policy: ElectronicDocumentAccessPolicy,
    private readonly electronic_document_lifecycle_policy: ElectronicDocumentLifecyclePolicy,
    private readonly electronic_document_serializer: ElectronicDocumentSerializer,
    private readonly outbox_service: OutboxService,
    private readonly idempotency_service: IdempotencyService,
  ) {}

  async execute({
    current_user,
    dto,
    idempotency_key,
  }: EmitElectronicDocumentCommand): Promise<ElectronicDocumentView> {
    const business_id = resolve_effective_business_id(current_user);

    return this.idempotency_service.execute(
      this.data_source,
      {
        business_id,
        user_id: current_user.id,
        scope: `sales.electronic_documents.emit.${dto.sale_order_id}`,
        idempotency_key: idempotency_key ?? null,
        request_payload: {
          sale_order_id: dto.sale_order_id,
          document_type: dto.document_type,
          receiver_name: dto.receiver_name ?? null,
          receiver_identification_type:
            dto.receiver_identification_type ?? null,
          receiver_identification_number:
            dto.receiver_identification_number ?? null,
          receiver_email: dto.receiver_email ?? null,
        },
      },
      async (manager) => {
        const sale_order =
          await this.sale_orders_repository.find_by_id_in_business_for_update(
            manager,
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

        this.sale_order_access_policy.assert_can_access_order(
          current_user,
          sale_order,
        );
        this.electronic_document_lifecycle_policy.assert_order_emittable(
          sale_order,
        );

        const subtotal = (sale_order.lines ?? []).reduce(
          (sum, line) => sum + Number(line.quantity) * Number(line.unit_price),
          0,
        );
        const tax_total = (sale_order.lines ?? []).reduce(
          (sum, line) => sum + Number(line.tax_amount),
          0,
        );
        const discount_total = (sale_order.lines ?? []).reduce((sum, line) => {
          const line_subtotal = Number(line.quantity) * Number(line.unit_price);
          return sum + line_subtotal * (Number(line.discount_percent) / 100);
        }, 0);
        const total = subtotal - discount_total + tax_total;

        const document = await manager.getRepository(ElectronicDocument).save(
          manager.getRepository(ElectronicDocument).create({
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
            receiver_name:
              dto.receiver_name ?? sale_order.customer_contact?.name ?? '',
            receiver_identification_type:
              dto.receiver_identification_type ?? null,
            receiver_identification_number:
              dto.receiver_identification_number ?? null,
            receiver_email: dto.receiver_email ?? null,
            hacienda_status: HaciendaStatus.PENDING,
            hacienda_response_xml: null,
            hacienda_message: null,
            submitted_at: null,
            accepted_at: null,
            xml_content: null,
            pdf_path: null,
          }),
        );

        await this.outbox_service.queue_event(manager, {
          business_id,
          event_name: ELECTRONIC_DOCUMENT_EMIT_REQUESTED_EVENT,
          aggregate_type: 'electronic_document',
          aggregate_id: document.id,
          payload: {
            electronic_document_id: document.id,
            sale_order_id: sale_order.id,
            branch_id: sale_order.branch_id,
            document_type: document.document_type,
          },
        });

        const full_document = await manager.getRepository(ElectronicDocument).findOne(
          {
            where: {
              id: document.id,
              business_id,
            },
            relations: {
              sale_order: true,
              branch: true,
            },
          },
        );
        if (!full_document) {
          throw new DomainNotFoundException({
            code: 'ELECTRONIC_DOCUMENT_NOT_FOUND',
            messageKey: 'sales.electronic_document_not_found',
            details: {
              electronic_document_id: document.id,
            },
          });
        }

        this.electronic_document_access_policy.assert_can_access_document(
          current_user,
          full_document,
        );
        return this.electronic_document_serializer.serialize(full_document);
      },
    );
  }
}
