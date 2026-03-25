import { SetMetadata } from '@nestjs/common';
import { PermissionKey } from '../enums/permission-key.enum';

export const REQUIRED_PERMISSIONS_KEY = 'required_permissions';

export const RequirePermissions = (...permissions: PermissionKey[]) =>
  SetMetadata(REQUIRED_PERMISSIONS_KEY, permissions);
