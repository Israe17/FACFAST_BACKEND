import { SetMetadata } from '@nestjs/common';

export const ALLOW_PLATFORM_PERMISSION_OVERRIDE_KEY =
  'allow_platform_permission_override';

export const AllowPlatformPermissionOverride = () =>
  SetMetadata(ALLOW_PLATFORM_PERMISSION_OVERRIDE_KEY, true);
