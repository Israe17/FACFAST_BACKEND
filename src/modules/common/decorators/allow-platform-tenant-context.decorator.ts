import { SetMetadata } from '@nestjs/common';

export const ALLOW_PLATFORM_TENANT_CONTEXT_KEY =
  'allow_platform_tenant_context';

export const AllowPlatformTenantContext = () =>
  SetMetadata(ALLOW_PLATFORM_TENANT_CONTEXT_KEY, true);
