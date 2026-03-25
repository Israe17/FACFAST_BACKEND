import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactType } from '../enums/contact-type.enum';

export interface ContactView {
  id: number;
  code: string | null;
  business_id: number;
  type: ContactType;
  name: string;
  commercial_name: string | null;
  identification_type: ContactIdentificationType;
  identification_number: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  tax_condition: string | null;
  economic_activity_code: string | null;
  is_active: boolean;
  exoneration_type: string | null;
  exoneration_document_number: string | null;
  exoneration_institution: string | null;
  exoneration_issue_date: string | null;
  exoneration_percentage: number | null;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
