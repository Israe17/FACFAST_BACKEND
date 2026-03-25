export interface ElectronicDocumentView {
  id: number;
  code: string | null;
  business_id: number;
  branch_id: number;
  document_type: string;
  document_key: string | null;
  consecutive: string | null;
  emission_date: Date;
  currency: string;
  subtotal: number;
  tax_total: number;
  discount_total: number;
  total: number;
  receiver_name: string;
  receiver_identification_type: string | null;
  receiver_identification_number: string | null;
  receiver_email: string | null;
  hacienda_status: string;
  hacienda_message: string | null;
  submitted_at: Date | null;
  accepted_at: Date | null;
  sale_order: { id: number; code: string | null } | null;
  branch: { id: number; name: string | null } | null;
  lifecycle: {
    can_resubmit: boolean;
    reasons: string[];
  };
  assets: {
    has_xml: boolean;
    has_pdf: boolean;
  };
  created_at: Date;
  updated_at: Date;
}
