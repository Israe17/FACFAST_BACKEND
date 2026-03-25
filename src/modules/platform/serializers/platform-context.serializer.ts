import { Injectable } from '@nestjs/common';
import { EntitySerializer } from '../../common/application/interfaces/entity-serializer.interface';
import { AuthenticatedUserMode } from '../../common/enums/authenticated-user-mode.enum';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';
import { PlatformContextView } from '../contracts/platform-context.view';

@Injectable()
export class PlatformContextSerializer
  implements EntitySerializer<AuthenticatedUserContext, PlatformContextView>
{
  serialize(current_user: AuthenticatedUserContext): PlatformContextView {
    return {
      success: true,
      mode: current_user.mode,
      business_id: current_user.business_id,
      acting_business_id: current_user.acting_business_id,
      acting_branch_id: current_user.acting_branch_id,
      is_platform_admin: current_user.is_platform_admin,
      platform_ready:
        current_user.mode === AuthenticatedUserMode.PLATFORM ||
        current_user.mode === AuthenticatedUserMode.TENANT_CONTEXT,
      tenant_context_active:
        current_user.mode === AuthenticatedUserMode.TENANT_CONTEXT,
    };
  }
}
