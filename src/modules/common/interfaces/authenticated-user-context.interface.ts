import type { UserType } from '../enums/user-type.enum';
import type { AuthenticatedUserMode } from '../enums/authenticated-user-mode.enum';

export interface AuthenticatedUserContext {
  id: number;
  business_id: number;
  active_business_language?: string | null;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  branch_ids: number[];
  max_sale_discount: number;
  user_type: UserType;
  is_platform_admin: boolean;
  acting_business_id: number | null;
  acting_branch_id: number | null;
  mode: AuthenticatedUserMode;
  session_id: number | null;
}
