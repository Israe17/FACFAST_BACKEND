# Tenant Context Switching Architecture

## Purpose

This phase adds a safe operational tenant context for platform super admins without mutating the authenticated user's real tenant identity.

The system now distinguishes between:

- real tenant identity
- temporary acting tenant context

This allows a platform super admin to enter a business, optionally narrow to a branch, and then use selected tenant endpoints as if operating inside that tenant.

## Real vs Acting Context

The authenticated user still keeps:

- `business_id`: real tenant of the user record
- `branch_ids`: real branch assignments of that user

New runtime context:

- `acting_business_id`
- `acting_branch_id`
- `mode`

Rules:

- normal tenant user:
  - `mode = tenant`
  - `acting_business_id = null`
  - `acting_branch_id = null`
- platform admin without tenant context:
  - `mode = platform`
  - `acting_business_id = null`
  - `acting_branch_id = null`
- platform admin with active tenant context:
  - `mode = tenant_context`
  - `acting_business_id = <selected business>`
  - `acting_branch_id = <selected branch or null>`

The real `business_id` never changes during this process.

## Where the Context Lives

The acting context is persisted on the current refresh session record in `refresh_tokens`.

New nullable columns:

- `acting_business_id`
- `acting_branch_id`

Why this choice:

- survives between requests
- tied to the current device/session
- works with the existing cookie-based auth model
- does not depend on frontend-only state
- avoids hidden mutation of the user record itself

## Auth Hydration

Access tokens now include `session_id`.

On each authenticated request:

1. `JwtAccessStrategy` resolves the persisted session by `session_id`
2. it validates that the session still belongs to the same user and real business
3. it hydrates the authenticated context with:
   - real `business_id`
   - real `branch_ids`
   - `acting_business_id`
   - `acting_branch_id`
   - `mode`
   - internal `session_id`

Refresh tokens follow the same pattern.

This means:

- entering or clearing tenant context takes effect immediately
- old revoked sessions stop working immediately
- the frontend does not need to resend tenant context on every request

## New Platform Endpoints

Implemented:

- `POST /platform/enter-business-context`
- `POST /platform/clear-business-context`

`POST /platform/enter-business-context`

Body:

```json
{
  "business_id": 7,
  "branch_id": 12
}
```

`branch_id` is optional.

Validation and rules:

- only `is_platform_admin = true`
- selected business must exist
- selected business must be active
- if `branch_id` is provided:
  - it must belong to that business
  - it must be active

`POST /platform/clear-business-context`

- clears `acting_business_id`
- clears `acting_branch_id`
- returns the platform admin to `mode = platform`

## auth/me

`GET /auth/me` now exposes:

- `business_id`
- `branch_ids`
- `user_type`
- `is_platform_admin`
- `acting_business_id`
- `acting_branch_id`
- `mode`

`session_id` is used internally and is not exposed in the response body.

## How Tenant Endpoints Respect the Context

This phase deliberately does not duplicate tenant modules under `/platform/*`.

Instead, selected tenant modules now resolve an effective tenant internally:

- real tenant users use `business_id`
- platform admins in `tenant_context` use `acting_business_id`

In this phase, the following tenant layers are wired to the effective context:

- `GET/PATCH /businesses/current`
- `users`
- `roles`
- `permissions`
- `branches`
- `terminals`
- `contacts`

These services now resolve tenant scope through a centralized tenant-context utility instead of assuming `current_user.business_id` is always the effective tenant.

## Guards and Security

### Platform Endpoints

Protected with:

- `JwtAuthGuard`
- `PlatformAdminGuard`

### Tenant Endpoints with Platform Context Support

Protected with:

- `JwtAuthGuard`
- `TenantContextGuard`
- `PermissionsGuard`

`TenantContextGuard` rules:

- normal tenant users are allowed as before
- platform admins are allowed only when `mode = tenant_context`

This prevents a platform admin from using tenant endpoints while still in pure platform mode.

### Permission Bypass Scope

Platform admins in `tenant_context` are allowed through `PermissionsGuard` only on tenant controllers explicitly marked to allow platform tenant context.

This avoids a blanket global bypass.

## Branch Scope Behavior

If a platform admin enters:

- business only:
  - full branch scope inside that tenant
- business + branch:
  - branch-sensitive policies narrow access to that branch

This affects branch access checks centrally without mutating the real branch assignments of the platform admin user.

## Response Flow

### Case A

Platform admin logs in:

- `auth/me -> mode = platform`
- can use `/platform/*`
- cannot use tenant endpoints yet

### Case B

Platform admin enters business context:

- `POST /platform/enter-business-context`
- `auth/me -> mode = tenant_context`
- `acting_business_id = X`
- tenant endpoints operate on tenant `X`

### Case C

Platform admin clears context:

- `POST /platform/clear-business-context`
- `auth/me -> mode = platform`
- acting ids become `null`

### Case D

Normal tenant user:

- unchanged behavior
- remains in `mode = tenant`

## Deliberately Out of Scope

This phase does not include:

- user impersonation
- login as tenant user
- changing the real `business_id` of the authenticated user
- delete business
- billing / plans / subscriptions
- advanced global platform RBAC beyond `is_platform_admin`
- tenant-context enablement for every existing module in the codebase

In this iteration, tenant-context support is wired only into the tenant modules needed for administrative operation:

- businesses/current
- users
- rbac
- branches
- contacts
