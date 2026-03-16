# Error Language Priority Architecture

## Before

The backend resolved the error language in this order:

1. `Accept-Language`
2. `business.language`
3. fallback `es`

This allowed the browser language to override the configured language of the
active tenant, which is not desirable for a business-centered SaaS system.

## Now

The backend resolves the error language in this order:

1. active business language
2. `Accept-Language`
3. fallback `es`

This keeps error messages aligned with the company currently being operated,
which is the correct behavior for both normal tenant users and platform admins
inside tenant context.

## Active Business Resolution

The language resolver now uses the active business for the request instead of
blindly using the authenticated user's real `business_id`.

Rules:

- tenant normal:
  - active business = real `business_id`
- platform admin in `tenant_context`:
  - active business = `acting_business_id`
- platform admin in `platform` mode:
  - active business = none

This logic is centralized in:

- [tenant-context.util.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/common/utils/tenant-context.util.ts)

Function:

- `resolve_active_business_id_for_i18n(current_user)`

## Runtime Cases

### Tenant normal

- user has `mode = tenant`
- backend reads `business.language` from the tenant business
- browser language does not override it

Example:

- business language = `en`
- `Accept-Language = es`
- final error language = `en`

### Platform admin in tenant_context

- user has `mode = tenant_context`
- backend reads `business.language` from `acting_business_id`
- browser language does not override it

Example:

- acting business language = `en`
- `Accept-Language = es`
- final error language = `en`

### Platform admin in platform mode

- user has `mode = platform`
- there is no active tenant for error language
- backend uses `Accept-Language`
- if header is not useful, fallback `es`

Example:

- no active business
- `Accept-Language = en`
- final error language = `en`

### Missing or empty business language

- if the active business exists but `business.language` is empty or invalid
- backend falls back to `Accept-Language`
- if header is not useful, fallback `es`

Example:

- business language = empty
- `Accept-Language = en`
- final error language = `en`

## Files Touched

- [error-i18n.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/common/i18n/error-i18n.service.ts)
- [error-i18n.service.spec.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/common/i18n/error-i18n.service.spec.ts)
- [tenant-context.util.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/common/utils/tenant-context.util.ts)

## What Stayed the Same

This change does not modify:

- error response shape
- `code`
- `messageKey`
- `details`
- `requestId`
- structured logging
- expected vs unexpected error handling

Only the language priority changed.

## Validation Evidence

The behavior is covered with tests for these scenarios:

1. tenant normal with business language `en` and browser `es` -> `en`
2. tenant normal with business language missing and browser `en` -> `en`
3. platform admin in `tenant_context` with acting business language `en` and browser `es` -> `en`
4. platform admin in `platform` mode without active tenant and browser `en` -> `en`
5. no useful business language and no useful browser language -> `es`
