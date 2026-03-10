import type { UserType } from '../enums/user-type.enum';

export interface AuthenticatedUserContext {
  id: number;
  business_id: number;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  branch_ids: number[];
  max_sale_discount: number;
  user_type: UserType;
}
