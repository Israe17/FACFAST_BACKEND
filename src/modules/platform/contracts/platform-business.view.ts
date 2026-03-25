import { IdentificationType } from '../../common/enums/identification-type.enum';

export interface PlatformBusinessView {
  id: number;
  code: string | null;
  name: string;
  legal_name: string;
  identification_type: IdentificationType;
  identification_number: string | null;
  currency_code: string;
  timezone: string;
  language: string;
  email: string | null;
  phone: string | null;
  website: string | null;
  logo_url: string | null;
  country: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  city: string | null;
  address: string | null;
  postal_code: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}
