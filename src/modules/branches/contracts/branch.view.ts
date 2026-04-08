import { IdentificationType } from '../../common/enums/identification-type.enum';
import { TerminalView } from './terminal.view';

export interface BranchView {
  id: number;
  code: string | null;
  business_id: number;
  business_name: string;
  name: string;
  legal_name: string;
  identification_type: IdentificationType;
  identification_number: string;
  cedula_juridica: string;
  branch_number: string;
  address: string;
  province: string;
  canton: string;
  district: string;
  city: string | null;
  phone: string | null;
  email: string | null;
  activity_code: string | null;
  provider_code: string | null;
  cert_path: string | null;
  hacienda_username: string | null;
  signature_type: string | null;
  is_active: boolean;
  latitude: number | null;
  longitude: number | null;
  has_crypto_key: boolean;
  has_hacienda_password: boolean;
  has_mail_key: boolean;
  lifecycle: {
    can_delete: boolean;
    can_deactivate: boolean;
    can_reactivate: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
  terminals: TerminalView[];
}
