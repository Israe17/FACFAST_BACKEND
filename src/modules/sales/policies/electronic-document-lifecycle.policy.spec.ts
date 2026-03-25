import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { DomainConflictException } from '../../common/errors/exceptions/domain-conflict.exception';
import { HaciendaStatus } from '../enums/hacienda-status.enum';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';
import { ElectronicDocumentLifecyclePolicy } from './electronic-document-lifecycle.policy';

describe('ElectronicDocumentLifecyclePolicy', () => {
  let policy: ElectronicDocumentLifecyclePolicy;

  beforeEach(() => {
    policy = new ElectronicDocumentLifecyclePolicy();
  });

  it('rejects emitting a document from a non-confirmed sale order', () => {
    expect(() =>
      policy.assert_order_emittable({ status: SaleOrderStatus.DRAFT }),
    ).toThrow(DomainBadRequestException);
  });

  it('rejects resubmission when document is neither failed nor rejected', () => {
    expect(() =>
      policy.assert_resubmittable({
        hacienda_status: HaciendaStatus.ACCEPTED,
      }),
    ).toThrow(DomainConflictException);
  });

  it('rejects submission when document is already submitted', () => {
    expect(() =>
      policy.assert_submittable({
        hacienda_status: HaciendaStatus.SUBMITTED,
      }),
    ).toThrow(DomainConflictException);
  });
});
