import { Contact } from '../../contacts/entities/contact.entity';
import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { ContactInvoiceReadinessPolicy } from './contact-invoice-readiness.policy';

function build_contact(overrides: Partial<Contact> = {}): Contact {
  return {
    id: 1,
    business_id: 1,
    name: 'Test Contact',
    email: null,
    phone: null,
    ...overrides,
  } as Contact;
}

describe('ContactInvoiceReadinessPolicy', () => {
  let policy: ContactInvoiceReadinessPolicy;

  beforeEach(() => {
    policy = new ContactInvoiceReadinessPolicy();
  });

  it('rejects contact without email or phone', () => {
    const contact = build_contact();
    expect(() => policy.assert_is_invoice_ready(contact)).toThrow(
      DomainBadRequestException,
    );
  });

  it('accepts contact with only email', () => {
    const contact = build_contact({ email: 'foo@bar.com' });
    expect(() => policy.assert_is_invoice_ready(contact)).not.toThrow();
  });

  it('accepts contact with only phone', () => {
    const contact = build_contact({ phone: '8888-8888' });
    expect(() => policy.assert_is_invoice_ready(contact)).not.toThrow();
  });

  it('accepts contact with both email and phone', () => {
    const contact = build_contact({ email: 'foo@bar.com', phone: '8888-8888' });
    expect(() => policy.assert_is_invoice_ready(contact)).not.toThrow();
  });

  it('exception payload includes contact identity for messaging', () => {
    const contact = build_contact({ id: 42, name: 'ACME S.A.' });
    try {
      policy.assert_is_invoice_ready(contact);
      fail('expected to throw');
    } catch (error) {
      const response = (error as DomainBadRequestException).getResponse() as {
        code: string;
        messageKey: string;
        details: Record<string, unknown>;
      };
      expect(response.code).toBe('INVOICE_RECEIVER_CONTACT_INCOMPLETE');
      expect(response.messageKey).toBe(
        'sales.invoice_readiness.email_or_phone_required',
      );
      expect(response.details).toEqual({
        contact_id: 42,
        contact_name: 'ACME S.A.',
      });
    }
  });
});
