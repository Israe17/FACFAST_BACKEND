import { TaxProfile } from '../../inventory/entities/tax-profile.entity';
import { TaxInclusionMode } from '../../inventory/enums/tax-inclusion-mode.enum';
import { TaxType } from '../../inventory/enums/tax-type.enum';
import { TaxCalculationService } from './tax-calculation.service';

function build_profile(overrides: Partial<TaxProfile> = {}): TaxProfile {
  return {
    tax_type: TaxType.IVA,
    iva_rate: 13,
    tax_inclusion_mode: TaxInclusionMode.ADDED,
    allows_exoneration: false,
    ...overrides,
  } as TaxProfile;
}

describe('TaxCalculationService', () => {
  let service: TaxCalculationService;

  beforeEach(() => {
    service = new TaxCalculationService();
  });

  it('computes IVA 13% added on top of net price', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile(),
    });
    expect(result.taxable_base).toBe(10000);
    expect(result.tax_gross).toBe(1300);
    expect(result.tax_net).toBe(1300);
    expect(result.line_total).toBe(11300);
  });

  it('extracts IVA from price when tax_inclusion_mode is included', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 11300,
      tax_profile: build_profile({
        tax_inclusion_mode: TaxInclusionMode.INCLUDED,
      }),
    });
    expect(result.taxable_base).toBeCloseTo(10000, 2);
    expect(result.tax_gross).toBeCloseTo(1300, 2);
    expect(result.line_total).toBeCloseTo(11300, 2);
  });

  it('applies discount to the net base, not the gross', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      discount_percent: 10,
      tax_profile: build_profile(),
    });
    // Base after discount: 9000. Tax: 9000 * 0.13 = 1170
    expect(result.taxable_base).toBe(9000);
    expect(result.discount_amount).toBe(1000);
    expect(result.tax_gross).toBeCloseTo(1170, 2);
    expect(result.line_total).toBeCloseTo(10170, 2);
  });

  it('skips tax when tax_profile is null', () => {
    const result = service.calculate_line_tax({
      quantity: 2,
      unit_price: 5000,
      tax_profile: null,
    });
    expect(result.tax_rate).toBe(0);
    expect(result.tax_gross).toBe(0);
    expect(result.tax_net).toBe(0);
    expect(result.line_total).toBe(10000);
  });

  it('skips tax for EXENTO profile (rate may be null)', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({
        tax_type: TaxType.EXENTO,
        iva_rate: null,
      }),
    });
    expect(result.tax_gross).toBe(0);
    expect(result.line_total).toBe(10000);
  });

  it('applies 100% customer exoneration: customer pays no tax', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({ allows_exoneration: true }),
      customer_allows_exoneration: true,
      customer_exoneration_percentage: 100,
    });
    expect(result.tax_gross).toBe(1300);
    expect(result.exoneration_amount).toBe(1300);
    expect(result.tax_net).toBe(0);
    expect(result.line_total).toBe(10000);
  });

  it('applies partial customer exoneration', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({ allows_exoneration: true }),
      customer_allows_exoneration: true,
      customer_exoneration_percentage: 50,
    });
    expect(result.tax_gross).toBe(1300);
    expect(result.exoneration_amount).toBe(650);
    expect(result.tax_net).toBe(650);
    expect(result.line_total).toBe(10650);
  });

  it('ignores exoneration when tax_profile does not allow it', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({ allows_exoneration: false }),
      customer_allows_exoneration: true,
      customer_exoneration_percentage: 100,
    });
    expect(result.exoneration_amount).toBe(0);
    expect(result.tax_net).toBe(1300);
  });

  it('ignores exoneration when customer flag is false even if profile allows it', () => {
    const result = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({ allows_exoneration: true }),
      customer_allows_exoneration: false,
      customer_exoneration_percentage: 100,
    });
    expect(result.exoneration_amount).toBe(0);
    expect(result.tax_net).toBe(1300);
  });

  it('clamps exoneration percentage to 0-100 range', () => {
    const over = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({ allows_exoneration: true }),
      customer_allows_exoneration: true,
      customer_exoneration_percentage: 150,
    });
    expect(over.exoneration_amount).toBe(1300);
    expect(over.tax_net).toBe(0);

    const negative = service.calculate_line_tax({
      quantity: 1,
      unit_price: 10000,
      tax_profile: build_profile({ allows_exoneration: true }),
      customer_allows_exoneration: true,
      customer_exoneration_percentage: -10,
    });
    expect(negative.exoneration_amount).toBe(0);
    expect(negative.tax_net).toBe(1300);
  });
});
