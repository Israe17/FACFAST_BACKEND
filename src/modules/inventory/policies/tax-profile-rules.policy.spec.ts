import { DomainBadRequestException } from '../../common/errors/exceptions/domain-bad-request.exception';
import { TaxProfile } from '../entities/tax-profile.entity';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';
import { TaxProfileRulesPolicy } from './tax-profile-rules.policy';

function build_profile(overrides: Partial<TaxProfile> = {}): TaxProfile {
  return {
    business_id: 1,
    name: 'Test Profile',
    description: null,
    cabys_code: '6210.0',
    item_kind: TaxProfileItemKind.GOODS,
    tax_type: TaxType.IVA,
    iva_rate_code: '08',
    iva_rate: 13,
    requires_cabys: true,
    allows_exoneration: false,
    has_specific_tax: false,
    specific_tax_name: null,
    specific_tax_rate: null,
    is_active: true,
    ...overrides,
  } as TaxProfile;
}

describe('TaxProfileRulesPolicy', () => {
  let policy: TaxProfileRulesPolicy;

  beforeEach(() => {
    policy = new TaxProfileRulesPolicy();
  });

  it('rejects IVA profile without iva_rate', () => {
    const profile = build_profile({ tax_type: TaxType.IVA, iva_rate: null });
    expect(() => policy.apply(profile)).toThrow(DomainBadRequestException);
  });

  it('clears IVA fields for non-IVA profiles', () => {
    const profile = build_profile({
      tax_type: TaxType.EXENTO,
      iva_rate: 13,
      iva_rate_code: '08',
    });
    policy.apply(profile);
    expect(profile.iva_rate).toBeNull();
    expect(profile.iva_rate_code).toBeNull();
  });

  it('rejects SPECIFIC_TAX profile missing specific fields', () => {
    const profile = build_profile({
      tax_type: TaxType.SPECIFIC_TAX,
      specific_tax_name: null,
      specific_tax_rate: null,
    });
    expect(() => policy.apply(profile)).toThrow(DomainBadRequestException);
  });

  it('forces has_specific_tax true for SPECIFIC_TAX profiles', () => {
    const profile = build_profile({
      tax_type: TaxType.SPECIFIC_TAX,
      has_specific_tax: false,
      specific_tax_name: 'Selectivo',
      specific_tax_rate: 5,
    });
    policy.apply(profile);
    expect(profile.has_specific_tax).toBe(true);
  });

  it('clears specific tax fields for non-SPECIFIC_TAX profiles', () => {
    const profile = build_profile({
      tax_type: TaxType.IVA,
      iva_rate: 13,
      has_specific_tax: true,
      specific_tax_name: 'Selectivo',
      specific_tax_rate: 5,
    });
    policy.apply(profile);
    expect(profile.has_specific_tax).toBe(false);
    expect(profile.specific_tax_name).toBeNull();
    expect(profile.specific_tax_rate).toBeNull();
  });
});
