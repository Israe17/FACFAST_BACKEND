# Frontend Contract For Contacts, Users, Branches And Terminals

## 1. Purpose

This document defines the exact frontend contract for:

- contacts
- users
- branches
- terminals
- role and permission alignment for these modules

The goal is to leave the frontend consistent, predictable, and fully aligned
with the backend after the latest delete and permission changes.

This is the source of truth for Codex or any frontend implementation work in
these modules.

## 2. Scope

This document covers:

- exact permissions the frontend must use
- exact endpoints the frontend must call
- lifecycle rules
- delete behavior
- response shapes relevant to UI
- error codes the frontend must map
- query invalidation and refetch guidance
- UX rules to avoid ambiguity

This document is focused on these modules only. Inventory-specific contract
details remain in:

- `docs/inventory-backend-consolidation-and-frontend-contract.md`
- `docs/inventory-permissions-frontend-alignment.md`

## 3. Source of truth in backend

Main backend files:

- `src/modules/contacts/controllers/contacts.controller.ts`
- `src/modules/contacts/services/contacts.service.ts`
- `src/modules/users/controllers/users.controller.ts`
- `src/modules/users/services/users.service.ts`
- `src/modules/branches/controllers/branches.controller.ts`
- `src/modules/branches/controllers/terminals.controller.ts`
- `src/modules/branches/services/branches.service.ts`
- `src/modules/common/enums/permission-key.enum.ts`
- `src/modules/rbac/controllers/permissions.controller.ts`
- `src/modules/rbac/services/rbac-seed.service.ts`
- `src/modules/rbac/utils/serialize-permission.util.ts`

## 4. Important high-level rules

1. The frontend must use `GET /permissions` as the only permission catalog
   source.
2. The frontend must not assume that `update` implies `delete`.
3. The frontend must not assume that `delete` is soft delete unless documented
   here.
4. These modules do not yet expose `lifecycle` metadata like inventory does.
5. Because there is no `lifecycle` field, the frontend must use:
   - explicit permissions
   - current entity state (`is_active`, `status`, `allow_login`)
   - backend business errors at execution time
6. For `users`, the lifecycle is not based on `is_active`. It uses:
   - `status`
   - `allow_login`
7. For `contacts`, `branches`, and `terminals`, deactivate/reactivate is done
   with `PATCH` and `is_active`.
8. For delete flows, the frontend must always show a confirmation dialog.

## 5. Permission catalog the frontend must honor

### Contacts

- `contacts.view`
- `contacts.create`
- `contacts.update`
- `contacts.delete`

### Users

- `users.view`
- `users.create`
- `users.update`
- `users.delete`
- `users.change_status`
- `users.change_password`
- `users.assign_roles`
- `users.assign_branches`

### Branches

- `branches.view`
- `branches.create`
- `branches.update`
- `branches.delete`
- `branches.configure`
- `branches.create_terminal`
- `branches.update_terminal`
- `branches.delete_terminal`

## 6. Official permission endpoint

### `GET /permissions`

Purpose:

- build the role configuration UI
- render permission groups and action checkboxes
- support feature gating in frontend

Requires:

- `permissions.view`

Response shape:

```json
[
  {
    "id": 12,
    "code": "PM-0012",
    "key": "contacts.delete",
    "module": "contacts",
    "action": "delete",
    "description": "Can delete contacts."
  }
]
```

Frontend rules:

- use `key` as the stable identifier
- use `module` for grouping
- use `action` for labels or sorting
- use `description` as helper text if needed
- do not hardcode a static list and ignore unknown permissions

## 7. Role screen contract

The role UI must now show these new explicit permissions:

- `contacts.delete`
- `branches.delete`
- `branches.delete_terminal`

Compatibility note:

The backend seeds these permissions and derives them automatically from older
permissions during bootstrap:

- `contacts.update` -> `contacts.delete`
- `branches.update` -> `branches.delete`
- `branches.update_terminal` -> `branches.delete_terminal`

Frontend implication:

- after backend restart, existing roles should continue to work
- the role screen must still show these permissions explicitly
- do not hide them just because older roles inherited them automatically

## 8. Contacts contract

### Relevant endpoints

| Endpoint | Purpose | Permission |
|---|---|---|
| `GET /contacts` | list contacts | `contacts.view` |
| `GET /contacts/:id` | contact detail | `contacts.view` |
| `GET /contacts/lookup/:identification` | lookup by identification | `contacts.view` |
| `POST /contacts` | create contact | `contacts.create` |
| `PATCH /contacts/:id` | update contact and toggle `is_active` | `contacts.update` |
| `DELETE /contacts/:id` | permanent delete | `contacts.delete` |

### Relevant response shape

Contact payload fields relevant for frontend:

```json
{
  "id": 10,
  "code": "CT-0010",
  "business_id": 1,
  "type": "supplier",
  "name": "Proveedor Regional",
  "commercial_name": "Distribuciones del Valle",
  "identification_type": "juridica",
  "identification_number": "3101123456",
  "email": "proveedor@empresa.com",
  "phone": "2222-3333",
  "address": "Heredia",
  "province": "Heredia",
  "canton": "Central",
  "district": "Mercedes",
  "tax_condition": null,
  "economic_activity_code": null,
  "is_active": true,
  "created_at": "2026-03-19T12:00:00.000Z",
  "updated_at": "2026-03-19T12:00:00.000Z"
}
```

### Deactivate and reactivate

For contacts there is no dedicated deactivate endpoint.

Frontend must use:

- `PATCH /contacts/:id` with `is_active: false` to deactivate
- `PATCH /contacts/:id` with `is_active: true` to reactivate

Required permission:

- `contacts.update`

### Permanent delete

Frontend must use:

- `DELETE /contacts/:id`

Response:

```json
{
  "id": 10,
  "deleted": true
}
```

Required permission:

- `contacts.delete`

Important note:

- the backend allows hard delete only when the contact has no operational history
- frontend must not label this action as "archive"
- this is physical delete

### UI rules for contacts

- show Edit if `contacts.update`
- show Deactivate if `contacts.update` and `is_active = true`
- show Reactivate if `contacts.update` and `is_active = false`
- show Delete if `contacts.delete`
- delete must be confirmed

### Contact delete caveat

Backend blocks hard delete when the contact has operational history in:

- `inventory_lots.supplier_contact_id`
- `serial_events.contact_id`

Expected business error:

```json
{
  "code": "CONTACT_DELETE_FORBIDDEN",
  "details": {
    "contact_id": 10,
    "dependencies": {
      "inventory_lots": 2,
      "serial_events": 1
    }
  }
}
```

Frontend implication:

- if backend returns `CONTACT_DELETE_FORBIDDEN`, keep the record visible
- show the dependency reason instead of assuming delete is always possible

### Contact errors to map

- `CONTACT_NOT_FOUND`
- `CONTACT_CODE_DUPLICATE`
- `CONTACT_IDENTIFICATION_DUPLICATE`
- `CONTACT_LOOKUP_MULTIPLE`
- `CONTACT_DELETE_FORBIDDEN`

## 9. Users contract

### Relevant endpoints

| Endpoint | Purpose | Permission |
|---|---|---|
| `GET /users` | list users | `users.view` |
| `GET /users/:id` | user detail | `users.view` |
| `POST /users` | create user | `users.create` |
| `PATCH /users/:id` | update user profile | `users.update` |
| `PATCH /users/:id/status` | activate, deactivate, suspend, mark deleted | `users.change_status` |
| `PATCH /users/:id/password` | change password | `users.change_password` |
| `PUT /users/:id/roles` | assign roles | `users.assign_roles` |
| `PUT /users/:id/branches` | assign branches | `users.assign_branches` |
| `GET /users/:id/effective-permissions` | effective permission context | `users.view` |
| `DELETE /users/:id` | hard delete if clean | `users.delete` |

### Relevant response shape

User payload fields relevant for frontend:

```json
{
  "id": 8,
  "code": "US-0008",
  "business_id": 1,
  "name": "Ana Perez",
  "email": "ana@empresa.com",
  "status": "active",
  "allow_login": true,
  "user_type": "staff",
  "is_platform_admin": false,
  "max_sale_discount": 0,
  "last_login_at": null,
  "roles": [],
  "branch_ids": [1, 2],
  "branches": [],
  "effective_permissions": ["users.view"]
}
```

### User lifecycle

Users do not use `is_active`.

Frontend must treat lifecycle as:

- active user:
  - `status = active`
  - optionally `allow_login = true`
- inactive user:
  - `status = inactive`
- suspended user:
  - `status = suspended`
- deleted status:
  - `status = deleted`

Frontend should use `PATCH /users/:id/status` for non-destructive lifecycle
changes.

Request shape:

```json
{
  "status": "inactive",
  "allow_login": false
}
```

Required permission:

- `users.change_status`

### Hard delete

Frontend must use:

- `DELETE /users/:id`

Response:

```json
{
  "id": 8,
  "deleted": true
}
```

Required permission:

- `users.delete`

### Delete blockers

The backend blocks user delete in these cases:

1. deleting yourself
2. deleting a platform admin user
3. deleting the last owner of the business
4. deleting a user that has operational inventory history

The backend currently checks these dependencies:

- `inventory_movement_headers`
- `inventory_movements`
- `serial_events`

### UI rules for users

- show Edit if `users.update`
- show Change Status if `users.change_status`
- show Change Password if `users.change_password`
- show Assign Roles if `users.assign_roles`
- show Assign Branches if `users.assign_branches`
- show Delete if `users.delete`
- hide Delete for the authenticated current user
- hide Delete when `is_platform_admin = true`
- for owner users:
  - if frontend knows there is only one owner, hide Delete
  - if frontend does not know, allow the action but handle backend error

### Recommended lifecycle UX for users

- use status toggle actions for day-to-day user administration
- reserve hard delete for cleanup of users with no operational history
- do not present delete as equivalent to deactivate

### User errors to map

- `USER_NOT_FOUND`
- `USER_EMAIL_DUPLICATE`
- `USER_INVALID_ROLES_FOR_BUSINESS`
- `USER_INVALID_BRANCHES_FOR_BUSINESS`
- `USER_SELF_DELETE_FORBIDDEN`
- `USER_PLATFORM_ADMIN_DELETE_FORBIDDEN`
- `USER_LAST_OWNER_DELETE_FORBIDDEN`
- `USER_DELETE_FORBIDDEN`
- `USER_OWNER_MANAGEMENT_FORBIDDEN`
- `USER_SYSTEM_MANAGEMENT_FORBIDDEN`
- `USER_CROSS_BUSINESS_MANAGEMENT_FORBIDDEN`

## 10. Branches contract

### Relevant endpoints

| Endpoint | Purpose | Permission |
|---|---|---|
| `GET /branches` | list branches | `branches.view` |
| `GET /branches/:id` | branch detail | `branches.view` |
| `POST /branches` | create branch | `branches.create` |
| `PATCH /branches/:id` | update branch and toggle `is_active` | `branches.update` |
| `DELETE /branches/:id` | hard delete if clean | `branches.delete` |
| `POST /branches/:id/terminals` | create terminal | `branches.create_terminal` |

### Relevant response shape

Branch payload fields relevant for frontend:

```json
{
  "id": 3,
  "code": "BR-0003",
  "business_id": 1,
  "business_name": "FastFact Heredia",
  "name": "Heredia",
  "legal_name": "FastFact Sociedad Anonima",
  "identification_type": "legal",
  "identification_number": "3101123456",
  "cedula_juridica": "3101123456",
  "branch_number": "003",
  "address": "Avenida Central",
  "province": "Heredia",
  "canton": "Central",
  "district": "Mercedes",
  "city": "Heredia",
  "phone": "2222-3333",
  "email": "heredia@empresa.com",
  "activity_code": null,
  "provider_code": null,
  "cert_path": null,
  "hacienda_username": null,
  "signature_type": null,
  "is_active": true,
  "has_crypto_key": false,
  "has_hacienda_password": false,
  "has_mail_key": false,
  "terminals": []
}
```

### Deactivate and reactivate

Frontend must use:

- `PATCH /branches/:id` with `is_active: false` to deactivate
- `PATCH /branches/:id` with `is_active: true` to reactivate

Required permission:

- `branches.update`

### Sensitive branch configuration

Some branch fields are sensitive and require `branches.configure` in addition to
normal branch access. These include:

- `activity_code`
- `provider_code`
- `cert_path`
- `crypto_key`
- `hacienda_username`
- `hacienda_password`
- `mail_key`
- `signature_type`

Frontend rule:

- if the user lacks `branches.configure`, hide or disable editing for sensitive
  configuration inputs

### Hard delete

Frontend must use:

- `DELETE /branches/:id`

Response:

```json
{
  "id": 3,
  "deleted": true
}
```

Required permission:

- `branches.delete`

### Delete blockers

The backend blocks branch delete if the branch has operational dependencies.

Current dependency keys checked by backend:

- `warehouses`
- `warehouse_locations`
- `warehouse_stock`
- `warehouse_branch_links`
- `inventory_lots`
- `inventory_movement_headers`
- `inventory_movements`

Blocked delete error shape:

```json
{
  "statusCode": 400,
  "code": "BRANCH_DELETE_FORBIDDEN",
  "messageKey": "branches.delete_forbidden",
  "details": {
    "branch_id": 3,
    "dependencies": {
      "warehouses": 1,
      "warehouse_locations": 0,
      "warehouse_stock": 5,
      "warehouse_branch_links": 1,
      "inventory_lots": 2,
      "inventory_movement_headers": 9,
      "inventory_movements": 14
    }
  }
}
```

### UI rules for branches

- show Edit if `branches.update`
- show Deactivate if `branches.update` and `is_active = true`
- show Reactivate if `branches.update` and `is_active = false`
- show Delete if `branches.delete`
- if branch has visible terminals in the UI, do not assume that blocks delete
- when delete fails with `BRANCH_DELETE_FORBIDDEN`, show a dependency message

### Branch errors to map

- `BRANCH_NOT_FOUND`
- `BRANCH_ACCESS_FORBIDDEN`
- `BRANCH_MANAGE_SCOPE_FORBIDDEN`
- `BRANCH_CONFIGURATION_PERMISSION_REQUIRED`
- `BRANCH_DELETE_FORBIDDEN`

## 11. Terminals contract

### Important note

There is no standalone terminal list endpoint.

Frontend gets terminals from:

- `GET /branches`
- `GET /branches/:id`

Each branch response includes `terminals: Terminal[]`.

### Relevant endpoints

| Endpoint | Purpose | Permission |
|---|---|---|
| `POST /branches/:id/terminals` | create terminal | `branches.create_terminal` |
| `PATCH /terminals/:id` | update terminal and toggle `is_active` | `branches.update_terminal` |
| `DELETE /terminals/:id` | hard delete terminal | `branches.delete_terminal` |

### Terminal response shape

```json
{
  "id": 21,
  "code": "TR-0021",
  "branch_id": 3,
  "terminal_number": "00021",
  "name": "Caja 2",
  "is_active": true,
  "created_at": "2026-03-19T12:00:00.000Z",
  "updated_at": "2026-03-19T12:00:00.000Z"
}
```

### Deactivate and reactivate

Frontend must use:

- `PATCH /terminals/:id` with `is_active: false` to deactivate
- `PATCH /terminals/:id` with `is_active: true` to reactivate

Required permission:

- `branches.update_terminal`

### Hard delete

Frontend must use:

- `DELETE /terminals/:id`

Response:

```json
{
  "id": 21,
  "deleted": true
}
```

Required permission:

- `branches.delete_terminal`

### UI rules for terminals

- show Create Terminal if `branches.create_terminal`
- show Edit Terminal if `branches.update_terminal`
- show Deactivate if `branches.update_terminal` and `is_active = true`
- show Reactivate if `branches.update_terminal` and `is_active = false`
- show Delete if `branches.delete_terminal`

### Terminal errors to map

- `TERMINAL_NOT_FOUND`
- `BRANCH_NOT_FOUND`
- `BRANCH_ACCESS_FORBIDDEN`

## 12. Unified frontend lifecycle rules

### Contacts

- active state source: `is_active`
- deactivate via `PATCH`
- reactivate via `PATCH`
- hard delete via `DELETE`

### Users

- active state source: `status` and `allow_login`
- deactivate or suspend via `PATCH /users/:id/status`
- reactivate via `PATCH /users/:id/status`
- hard delete via `DELETE /users/:id`

### Branches

- active state source: `is_active`
- deactivate via `PATCH`
- reactivate via `PATCH`
- hard delete via `DELETE`

### Terminals

- active state source: `is_active`
- deactivate via `PATCH`
- reactivate via `PATCH`
- hard delete via `DELETE`

## 13. Exact button visibility rules

### Contacts list and detail

- Edit: `contacts.update`
- Deactivate: `contacts.update` and `is_active = true`
- Reactivate: `contacts.update` and `is_active = false`
- Delete: `contacts.delete`

### Users list and detail

- Edit: `users.update`
- Change status: `users.change_status`
- Change password: `users.change_password`
- Assign roles: `users.assign_roles`
- Assign branches: `users.assign_branches`
- Delete: `users.delete`

Additional user delete UI guards:

- hide delete if row user id equals authenticated user id
- hide delete if `is_platform_admin = true`

### Branches list and detail

- Edit: `branches.update`
- Edit sensitive config: `branches.update` and `branches.configure`
- Deactivate: `branches.update` and `is_active = true`
- Reactivate: `branches.update` and `is_active = false`
- Delete: `branches.delete`
- Create terminal: `branches.create_terminal`

### Terminal actions

- Edit: `branches.update_terminal`
- Deactivate: `branches.update_terminal` and `is_active = true`
- Reactivate: `branches.update_terminal` and `is_active = false`
- Delete: `branches.delete_terminal`

## 14. Exact error mapping the frontend must support

### Contacts

- `CONTACT_NOT_FOUND`
- `CONTACT_CODE_DUPLICATE`
- `CONTACT_IDENTIFICATION_DUPLICATE`
- `CONTACT_LOOKUP_MULTIPLE`

### Users

- `USER_NOT_FOUND`
- `USER_EMAIL_DUPLICATE`
- `USER_INVALID_ROLES_FOR_BUSINESS`
- `USER_INVALID_BRANCHES_FOR_BUSINESS`
- `USER_SELF_DELETE_FORBIDDEN`
- `USER_PLATFORM_ADMIN_DELETE_FORBIDDEN`
- `USER_LAST_OWNER_DELETE_FORBIDDEN`
- `USER_DELETE_FORBIDDEN`
- `USER_OWNER_ASSIGNMENT_FORBIDDEN`
- `USER_OWNER_MANAGEMENT_FORBIDDEN`
- `USER_SYSTEM_MANAGEMENT_FORBIDDEN`
- `USER_CROSS_BUSINESS_MANAGEMENT_FORBIDDEN`

### Branches

- `BRANCH_NOT_FOUND`
- `BRANCH_ACCESS_FORBIDDEN`
- `BRANCH_MANAGE_SCOPE_FORBIDDEN`
- `BRANCH_CONFIGURATION_PERMISSION_REQUIRED`
- `BRANCH_DELETE_FORBIDDEN`

### Terminals

- `TERMINAL_NOT_FOUND`

## 15. Refetch and invalidation strategy

### Contacts

After create, update, deactivate, reactivate, or delete:

- invalidate `contacts`
- invalidate `contact(id)`
- invalidate any contact lookup query if open
- invalidate any supplier selector cache used by inventory lot forms

### Users

After create, update, status change, password change, role assignment,
branch assignment, or delete:

- invalidate `users`
- invalidate `user(id)`
- invalidate `user-effective-permissions(id)` if open
- invalidate `roles` and `role(id)` after assign roles if the UI shows
  role-user relationships
- invalidate current auth context only if the affected user is the currently
  authenticated user

### Branches

After create, update, deactivate, reactivate, terminal create, or delete:

- invalidate `branches`
- invalidate `branch(id)`
- invalidate branch selectors used across the app
- invalidate user branch assignment queries if open
- invalidate inventory screens that depend on accessible branch options if the
  branch set changed materially

### Terminals

After create, update, deactivate, reactivate, or delete:

- invalidate `branches`
- invalidate `branch(id)` for the owning branch
- invalidate any terminal selector derived from branch detail

### Permissions and roles

After deploying backend permission changes:

- refetch `permissions`
- refetch `roles`
- refetch `role(id)` screens

## 16. Frontend implementation checklist

The frontend should implement all of the following:

1. Role screen shows:
   - `contacts.delete`
   - `branches.delete`
   - `branches.delete_terminal`
2. Contact screens support:
   - deactivate/reactivate with `PATCH is_active`
   - hard delete with `DELETE`
3. User screens support:
   - status changes through `PATCH /users/:id/status`
   - hard delete through `DELETE /users/:id`
4. Branch screens support:
   - deactivate/reactivate with `PATCH is_active`
   - hard delete with dependency-aware error handling
5. Terminal actions support:
   - deactivate/reactivate with `PATCH is_active`
   - hard delete through `DELETE`
6. Delete confirmations are explicit and distinguish:
   - deactivate
   - reactivate
   - permanent delete
7. UI never assumes delete is available just because update is available.

## 17. What the frontend must not assume

- do not assume these modules expose `lifecycle`
- do not assume delete is always soft
- do not assume users use `is_active`
- do not assume terminals have their own list endpoint
- do not assume a branch with terminals cannot be deleted
- do not assume contact delete is blocked by historical supplier use
- do not assume a user with no visible orders is safe to delete; backend still
  checks movement history

## 18. Prompt for Codex Frontend

Use this prompt when implementing the frontend side:

```md
Act as a Senior Frontend Engineer and align the frontend with the backend
contract for contacts, users, branches, terminals, roles, and permissions.

Source of truth:
- C:\Users\cente\OneDrive\Documentos\fastfact\api\docs\frontend-contract-contacts-users-branches-terminals.md
- C:\Users\cente\OneDrive\Documentos\fastfact\api\docs\inventory-permissions-frontend-alignment.md
- C:\Users\cente\OneDrive\Documentos\fastfact\api\docs\inventory-backend-consolidation-and-frontend-contract.md

Mandatory implementation rules:
1. Use `GET /permissions` as the permission catalog source.
2. Respect explicit delete permissions:
   - `contacts.delete`
   - `users.delete`
   - `branches.delete`
   - `branches.delete_terminal`
3. Do not assume `update` implies `delete`.
4. For contacts, branches, and terminals:
   - deactivate/reactivate with `PATCH` and `is_active`
   - hard delete with `DELETE`
5. For users:
   - use `PATCH /users/:id/status` for status lifecycle
   - use `DELETE /users/:id` only for hard delete
6. Hide or disable actions according to exact permissions.
7. Add clear confirmation UX for destructive actions.
8. Map backend errors by `code`, not by free text.
9. Keep the existing frontend architecture and design language.
10. Do not invent endpoints or fields.

Deliver:
- code changes
- route and button permission mapping
- query keys and invalidation notes
- final lint/build/tests verification
```
