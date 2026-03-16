# Business Onboarding Architecture

## Purpose

`POST /platform/businesses/onboarding` provisions a complete tenant in one logical operation.

This is not a regular CRUD create because a `business` cannot operate by itself. A usable tenant also needs:

- base RBAC permissions
- suggested system roles for the tenant
- an `owner` user
- an initial branch
- an optional initial terminal

If any step fails, the onboarding transaction is rolled back.

## Chosen Route

Route:

- `POST /platform/businesses/onboarding`

Why this route:

- it now lives inside the platform layer, not the tenant layer
- it makes clear that the action is provisioning, not plain CRUD
- it keeps `GET /businesses/current` and `PATCH /businesses/current` focused on self-management of the current tenant

## Entities Touched

The onboarding transaction touches these entities:

- `Business`
- `Permission`
- `Role`
- `RolePermission`
- `User`
- `UserRole`
- `Branch`
- `UserBranchAccess`
- `Terminal` when requested

## Flow

1. Validate business identification uniqueness.
2. Validate owner email uniqueness using the current global email logic.
3. Seed base permissions inside the transaction.
4. Create `business`.
5. Seed suggested roles for the new business inside the same transaction.
6. Resolve the `owner` role for the new business.
7. Create the owner user with:
   - `user_type = owner`
   - `status = active`
   - `allow_login = true`
8. Assign the `owner` role to the user.
9. Create the initial branch linked to the new business.
10. Assign the owner access to the initial branch.
11. Create the initial terminal if requested.
12. Return the created business, owner, branch and terminal summary.

## Validation Rules

### Business

- `name`, `legal_name`, `identification_type`, `identification_number`
- `currency_code` required, normalized to uppercase
- `timezone` required
- business email validated when present
- business identification is checked for duplicates before insert

### Owner

- `owner_email` required and valid
- `owner_password` minimum length 10
- owner email respects the current backend rule: globally unique user email
- owner full name is built from `owner_name + owner_last_name`

### Initial Branch

- mandatory
- `branch_number` required and validated as 3 digits
- `branch_identification_type` required
- `branch_identification_number` required
- branch is always linked to the newly created business
- branch legal name is inherited from the business legal name
- branch `business_name` is derived from `business.name + branch_name`

### Initial Terminal

- optional
- if `create_initial_terminal = true`, `terminal_name` and `terminal_number` are required
- `terminal_number` is validated as 5 digits

## Transaction Strategy

The onboarding is executed with a TypeORM transaction through `DataSource.transaction(...)`.

This guarantees:

- no orphan `business` if owner creation fails
- no partial RBAC bootstrap for the new tenant
- no tenant without initial branch if branch creation fails
- no missing owner role assignment

## Response Shape

The response returns:

- `business`
- `owner`
- `initial_branch`
- `initial_terminal` or `null`
- `onboarding_ready = true`

Sensitive values are not exposed:

- owner password hash is never returned
- branch encrypted secrets are not part of onboarding output

## Deliberately Left Out

This phase does not implement:

- delete business
- global businesses listing for a superadmin
- public self-signup from frontend
- plans, billing or subscriptions
- email activation or password recovery
- operational modules such as purchases, sales, POS, expenses or Hacienda
