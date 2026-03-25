import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';

export interface PlatformContextView {
  success: true;
  mode: AuthenticatedUserMode;
  business_id: number;
  acting_business_id: number | null;
  acting_branch_id: number | null;
  is_platform_admin: boolean;
  platform_ready: boolean;
  tenant_context_active: boolean;
}
