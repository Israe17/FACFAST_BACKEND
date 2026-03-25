import { PermissionView } from './permission.view';

export interface RoleView {
  id: number;
  code: string | null;
  business_id: number;
  name: string;
  role_key: string;
  is_system: boolean;
  permissions: PermissionView[];
  lifecycle: {
    can_update: boolean;
    can_delete: boolean;
    can_assign_permissions: boolean;
    reasons: string[];
  };
  created_at: Date;
  updated_at: Date;
}
