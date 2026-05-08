import { Injectable } from '@nestjs/common';
import { TaxProfile } from '../../inventory/entities/tax-profile.entity';
import { TaxInclusionMode } from '../../inventory/enums/tax-inclusion-mode.enum';
import { TaxType } from '../../inventory/enums/tax-type.enum';

export type TaxCalculationInput = {
  quantity: number;
  unit_price: number;
  discount_percent?: number;
  tax_profile: TaxProfile | null;
  customer_exoneration_percentage?: number | null;
  customer_allows_exoneration?: boolean;
};

export type TaxCalculationResult = {
  /** Quantity × unit_price (raw, before discount and tax extraction) */
  gross_amount: number;
  /** Net amount before tax (after extracting tax if inclusion=included). Excludes discount. */
  base_pre_discount: number;
  /** Money discounted off the taxable base */
  discount_amount: number;
  /** Net amount taxable after discount */
  taxable_base: number;
  /** IVA rate applied (0-100) */
  tax_rate: number;
  /** Tax that would apply without exoneration */
  tax_gross: number;
  /** Tax forgiven via customer exoneration */
  exoneration_amount: number;
  /** Effective tax amount the customer pays */
  tax_net: number;
  /** Final line total: taxable_base + tax_net */
  line_total: number;
};

@Injectable()
export class TaxCalculationService {
  /**
   * Compute tax breakdown for a sale order line.
   *
   * Rules:
   * - If tax_profile is null OR tax_type is not IVA: zero tax. The product
   *   shouldn't be sellable at all (assert_product_can_be_invoiced gates),
   *   but defensively we return zero rather than crash.
   * - tax_inclusion_mode 'included': unit_price already includes IVA.
   *   We extract the net via base = price / (1 + rate/100).
   * - tax_inclusion_mode 'added' (default): unit_price is the net.
   *   IVA is computed on top.
   * - Discount applies to the net base. Tax is recomputed on the
   *   discounted base, never on the gross.
   * - Customer exoneration is applied only when:
   *     (a) tax_profile.allows_exoneration is true AND
   *     (b) customer_allows_exoneration is true AND
   *     (c) customer_exoneration_percentage is a positive number.
   *   The exoneration percentage forgives that share of the tax.
   *   Example: 13% IVA on ₡10,000 = ₡1,300. With 100% exoneration, tax_net = 0.
   *   With 13% exoneration, tax_net = ₡1,300 × (1 - 0.13) = ₡1,131.
   */
  calculate_line_tax(input: TaxCalculationInput): TaxCalculationResult {
    const quantity = Number(input.quantity);
    const unit_price = Number(input.unit_price);
    const discount_percent = Math.max(0, Math.min(100, input.discount_percent ?? 0));
    const gross_amount = quantity * unit_price;

    const tax_profile = input.tax_profile;
    const has_iva =
      tax_profile !== null &&
      tax_profile !== undefined &&
      tax_profile.tax_type === TaxType.IVA &&
      tax_profile.iva_rate !== null &&
      tax_profile.iva_rate !== undefined &&
      Number(tax_profile.iva_rate) > 0;

    if (!has_iva) {
      const base_pre_discount = gross_amount;
      const discount_amount =
        base_pre_discount * (discount_percent / 100);
      const taxable_base = base_pre_discount - discount_amount;
      return {
        gross_amount,
        base_pre_discount,
        discount_amount,
        taxable_base,
        tax_rate: 0,
        tax_gross: 0,
        exoneration_amount: 0,
        tax_net: 0,
        line_total: taxable_base,
      };
    }

    const rate = Number(tax_profile!.iva_rate);
    const inclusion = tax_profile!.tax_inclusion_mode;

    const base_pre_discount =
      inclusion === TaxInclusionMode.INCLUDED
        ? gross_amount / (1 + rate / 100)
        : gross_amount;

    const discount_amount = base_pre_discount * (discount_percent / 100);
    const taxable_base = base_pre_discount - discount_amount;
    const tax_gross = taxable_base * (rate / 100);

    const exoneration_pct = this.resolve_effective_exoneration_percent(
      tax_profile!,
      input.customer_allows_exoneration ?? false,
      input.customer_exoneration_percentage ?? null,
    );
    const exoneration_amount = tax_gross * (exoneration_pct / 100);
    const tax_net = tax_gross - exoneration_amount;

    const line_total = taxable_base + tax_net;

    return {
      gross_amount,
      base_pre_discount,
      discount_amount,
      taxable_base,
      tax_rate: rate,
      tax_gross,
      exoneration_amount,
      tax_net,
      line_total,
    };
  }

  private resolve_effective_exoneration_percent(
    tax_profile: TaxProfile,
    customer_allows_exoneration: boolean,
    customer_exoneration_percentage: number | null,
  ): number {
    if (!tax_profile.allows_exoneration) {
      return 0;
    }
    if (!customer_allows_exoneration) {
      return 0;
    }
    if (
      customer_exoneration_percentage === null ||
      customer_exoneration_percentage === undefined
    ) {
      return 0;
    }
    const pct = Number(customer_exoneration_percentage);
    if (Number.isNaN(pct) || pct <= 0) {
      return 0;
    }
    return Math.min(100, pct);
  }
}
