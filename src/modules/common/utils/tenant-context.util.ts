import { AuthenticatedUserMode } from '../enums/authenticated-user-mode.enum';
import { DomainForbiddenException } from '../errors/exceptions/domain-forbidden.exception';
import { UserType } from '../enums/user-type.enum';
import { AuthenticatedUserContext } from '../interfaces/authenticated-user-context.interface';

export function is_platform_user(
  current_user: AuthenticatedUserContext,
): boolean {
  return current_user.is_platform_admin === true;
}

export function is_platform_tenant_context(
  current_user: AuthenticatedUserContext,
): boolean {
  return (
    is_platform_user(current_user) &&
    current_user.mode === AuthenticatedUserMode.TENANT_CONTEXT &&
    current_user.acting_business_id !== null
  );
}

export function assert_tenant_context_active(
  current_user: AuthenticatedUserContext,
): void {
  if (
    is_platform_user(current_user) &&
    current_user.mode !== AuthenticatedUserMode.TENANT_CONTEXT
  ) {
    throw new DomainForbiddenException({
      code: 'PLATFORM_TENANT_CONTEXT_REQUIRED',
      messageKey: 'platform.tenant_context_required',
    });
  }
}

export function resolve_effective_business_id(
  current_user: AuthenticatedUserContext,
): number {
  return is_platform_tenant_context(current_user) &&
    current_user.acting_business_id !== null
    ? current_user.acting_business_id
    : current_user.business_id;
}

export function resolve_active_business_id_for_i18n(
  current_user: AuthenticatedUserContext,
): number | null {
  if (is_platform_tenant_context(current_user)) {
    return current_user.acting_business_id;
  }

  if (
    is_platform_user(current_user) &&
    current_user.mode === AuthenticatedUserMode.PLATFORM
  ) {
    return null;
  }

  return current_user.business_id;
}

export function has_full_effective_branch_access(
  current_user: AuthenticatedUserContext,
): boolean {
  if (is_platform_tenant_context(current_user)) {
    return current_user.acting_branch_id === null;
  }

  return current_user.user_type === UserType.OWNER;
}

export function resolve_effective_branch_scope_ids(
  current_user: AuthenticatedUserContext,
): number[] | undefined {
  if (has_full_effective_branch_access(current_user)) {
    return undefined;
  }

  if (is_platform_tenant_context(current_user)) {
    return current_user.acting_branch_id !== null
      ? [current_user.acting_branch_id]
      : undefined;
  }

  return current_user.branch_ids;
}

export function can_access_effective_branch(
  current_user: AuthenticatedUserContext,
  branch_id: number,
): boolean {
  if (has_full_effective_branch_access(current_user)) {
    return true;
  }

  const scoped_branch_ids = resolve_effective_branch_scope_ids(current_user);
  return scoped_branch_ids?.includes(branch_id) ?? false;
}
