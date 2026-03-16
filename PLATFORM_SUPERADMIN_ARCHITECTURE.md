# Platform Super Admin Architecture

## Tenant vs Platform

The backend now separates two access contexts:

### Tenant Normal

- fixed `business_id`
- fixed `branch_ids`
- uses tenant endpoints such as:
  - `GET /businesses/current`
  - `PATCH /businesses/current`
  - `users`, `branches`, `contacts` inside the authenticated tenant

### Platform Super Admin

- authenticated user still has a real `business_id`
- additionally has `is_platform_admin = true`
- can access `/platform/*` endpoints
- can inspect arbitrary businesses without changing the real session tenant

This preserves tenant isolation while enabling a platform panel.

## Why an Explicit User Flag

The chosen model is an explicit user flag:

- `users.is_platform_admin`

Reasons:

- current roles are tenant-scoped by `business_id`
- a global role such as `platform_super_admin` would conflict with the current RBAC model
- a user flag is additive, clear and low-risk
- it avoids forcing nullable `business_id` or a separate global-roles subsystem in this phase

Platform admins continue to be regular users in the table, but the backend can now resolve:

- normal tenant user
- platform super admin

through the authenticated context.

## Authenticated Context

`auth/me` now exposes:

- `business_id`
- `branch_ids`
- `user_type`
- `is_platform_admin`

Important:

- `business_id` does not change during platform business switching
- the frontend-selected business is only a UI/endpoint context for `/platform/*`
- this phase does not implement impersonation or session tenant switching

## Security Model

Platform endpoints are protected with:

- `JwtAuthGuard`
- `PlatformAdminGuard`

`PlatformAdminGuard` explicitly requires:

- `current_user.is_platform_admin === true`

This means:

- tenant users cannot list all businesses
- tenant users cannot inspect arbitrary businesses
- tenant users cannot query branches of other businesses through `/platform/*`

Tenant security remains unchanged for existing modules.

## Platform Endpoints

Implemented endpoints:

- `GET /platform/businesses`
- `GET /platform/businesses/:id`
- `GET /platform/businesses/:id/branches`
- `POST /platform/businesses/onboarding`

These endpoints are intentionally separated from `business/current`.

## Business Switching

Business switching in this phase is conceptual and frontend-driven:

1. frontend lists businesses through `GET /platform/businesses`
2. frontend stores a selected `activeBusinessId`
3. frontend fetches:
   - business detail with `GET /platform/businesses/:id`
   - branches with `GET /platform/businesses/:id/branches`
4. backend never mutates the authenticated user's real `business_id`

This keeps switching safe and avoids hidden session mutation.

## Onboarding Integration

The onboarding flow is now exposed through the platform layer:

- `POST /platform/businesses/onboarding`

It reuses the existing transactional onboarding service and still performs:

1. create business
2. seed base permissions
3. seed suggested tenant roles
4. create owner user
5. assign owner role
6. create initial branch
7. assign owner access to that branch
8. create initial terminal if requested

All steps remain inside one transaction.

## Platform Admin Bootstrap

A CLI script is provided to create the initial platform admin:

- `pnpm run create-platform-admin -- --business-id <id> --name "Platform Admin" --email "platform@empresa.com" --password "ClaveSegura123!"`

The platform admin:

- is stored as a regular user
- has `user_type = system`
- has `is_platform_admin = true`

For session handling, platform admins automatically receive `auth.login` and `auth.refresh` in the resolved authenticated context, without depending on tenant-scoped roles.

## Deliberately Out of Scope

This phase does not include:

- impersonation
- login as tenant
- delete business
- billing / subscriptions / plans
- global analytics or advanced summaries
- operational cross-tenant actions inside tenant modules
- advanced platform RBAC beyond the `is_platform_admin` flag
