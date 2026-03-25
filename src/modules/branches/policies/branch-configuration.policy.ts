import { Injectable } from '@nestjs/common';
import { PermissionKey } from '../../common/enums/permission-key.enum';
import { DomainForbiddenException } from '../../common/errors/exceptions/domain-forbidden.exception';
import { AuthenticatedUserContext } from '../../common/interfaces/authenticated-user-context.interface';

@Injectable()
export class BranchConfigurationPolicy {
  assert_configuration_permissions(
    current_user: AuthenticatedUserContext,
    dto: {
      activity_code?: string;
      provider_code?: string;
      cert_path?: string;
      crypto_key?: string;
      hacienda_username?: string;
      hacienda_password?: string;
      mail_key?: string;
      signature_type?: string;
    },
  ): void {
    const touches_sensitive_configuration = [
      dto.activity_code,
      dto.provider_code,
      dto.cert_path,
      dto.crypto_key,
      dto.hacienda_username,
      dto.hacienda_password,
      dto.mail_key,
      dto.signature_type,
    ].some((value) => value !== undefined);

    if (
      touches_sensitive_configuration &&
      !current_user.permissions.includes(PermissionKey.BRANCHES_CONFIGURE)
    ) {
      throw new DomainForbiddenException({
        code: 'BRANCH_CONFIGURATION_PERMISSION_REQUIRED',
        messageKey: 'branches.configuration_permission_required',
      });
    }
  }
}
