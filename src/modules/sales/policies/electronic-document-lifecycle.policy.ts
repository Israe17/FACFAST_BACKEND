import { Injectable } from '@nestjs/common';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { HaciendaStatus } from '../enums/hacienda-status.enum';

@Injectable()
export class ElectronicDocumentLifecyclePolicy {
  assert_order_emittable(order: { status: SaleOrderStatus }): void {
    if (order.status !== SaleOrderStatus.CONFIRMED) {
      throw new DomainBadRequestException({
        code: 'ELECTRONIC_DOCUMENT_SALE_ORDER_NOT_EMITTABLE',
        messageKey: 'sales.electronic_document_sale_order_not_emittable',
        details: {
          status: order.status,
        },
      });
    }
  }

  assert_resubmittable(document: { hacienda_status: HaciendaStatus }): void {
    if (
      document.hacienda_status !== HaciendaStatus.ERROR &&
      document.hacienda_status !== HaciendaStatus.REJECTED
    ) {
      throw new DomainConflictException({
        code: 'ELECTRONIC_DOCUMENT_NOT_RESUBMITTABLE',
        messageKey: 'sales.electronic_document_not_resubmittable',
        details: {
          hacienda_status: document.hacienda_status,
        },
      });
    }
  }

  assert_submittable(document: { hacienda_status: HaciendaStatus }): void {
    if (
      document.hacienda_status === HaciendaStatus.SUBMITTED ||
      document.hacienda_status === HaciendaStatus.ACCEPTED
    ) {
      throw new DomainConflictException({
        code: 'ELECTRONIC_DOCUMENT_NOT_SUBMITTABLE',
        messageKey: 'sales.electronic_document_not_submittable',
        details: {
          hacienda_status: document.hacienda_status,
        },
      });
    }
  }
}
