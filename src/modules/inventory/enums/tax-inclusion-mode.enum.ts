export enum TaxInclusionMode {
  /** Displayed price already includes IVA. Net = price / (1 + rate). */
  INCLUDED = 'included',
  /** Displayed price is net. IVA is added on top at sale time. */
  ADDED = 'added',
}
