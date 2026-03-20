# Commercial Branch Context For Contacts, Pricing And Promotions

## 1. Executive Summary

This phase adds a branch-aware commercial context layer without duplicating global master entities and without breaking the current backend architecture.

What was implemented:

- `contacts` remain business-wide, but now support branch assignments through `contact_branch_assignments`.
- `price_lists` remain business-wide, but now support branch enablement/default assignment through `price_list_branch_assignments`.
- `promotions` remain business-wide, but now support branch applicability through `promotion_branch_assignments`.
- New controllers, DTOs, repositories, services, permissions, and response serializers were added following the existing `controller -> service -> repository -> entity/dto` pattern.
- Branch access, tenant isolation, and business ownership validation were enforced on all new flows.

What was intentionally not implemented in this phase:

- No effective price engine by branch yet.
- No branch overrides on product prices yet.
- No automatic operational enforcement of contact assignments in future sales/quotation modules, because those modules are not yet part of this implementation.
- No duplication of contacts, price lists, or promotions per branch.

This phase establishes the correct foundation:

1. Global business catalog.
2. Branch assignment layer.
3. Future branch override layer, documented but not forced into this phase.

## 2. Current-State Audit

### 2.1 Contacts

Current state before this phase:

- `contacts` were modeled as business-wide records.
- Contacts already had standard CRUD and lifecycle through `is_active`.
- Contacts had no commercial context by branch.
- Contacts could not express branch-specific enablement, preference, exclusivity, credit policy, price list preference, or account manager assignment.

What the current backend still keeps:

- `contacts` remain the master record for the company.
- `contacts` are not duplicated per branch.
- Global contact CRUD remains unchanged.

What was missing before this phase:

- A way to say "this contact is only usable in branch A".
- A way to say "this contact is preferred in branch B".
- A way to say "this contact should use branch-specific commercial defaults".

### 2.2 Branches

Current state before this phase:

- `branches` already existed and are the operational branch boundary.
- Branch access was already enforced through the existing branch access policy.
- Several operational inventory flows were already branch-aware.

What the current backend already provided and this phase reuses:

- tenant isolation by `business_id`
- effective branch scope resolution
- branch access validation through current user context

These existing capabilities made it possible to add a branch assignment layer without introducing a parallel architecture.

### 2.3 Price Lists

Current state before this phase:

- `price_lists` were business-wide catalogs.
- `product_prices` were publicly modeled under `products/:id/prices`.
- Public pricing contract remained product-level, with `product_variant_id` as optional refinement on the row.
- No official branch pricing assignment existed.
- No branch default price list existed.
- No branch-specific availability check existed for price lists.

Important current limitation that still remains after this phase:

- There is still no effective price resolution engine by branch.
- There is still no branch price override row for `product_prices`.

### 2.4 Promotions

Current state before this phase:

- `promotions` were business-wide catalogs.
- Promotions were managed independently from `price_lists`.
- Promotions already supported active/inactive lifecycle and product or variant targeting.
- No branch applicability layer existed.

Important current limitation that still remains after this phase:

- Promotions are still not merged into price list resolution.
- This phase only adds branch applicability assignment.

### 2.5 Existing Design Elements Reused

The current codebase already had patterns that this phase deliberately reused:

- `business_id` ownership checks.
- `branch_id` access checks via branch access policy.
- repository pattern per module.
- explicit DTO validation.
- service-level business rules.
- lifecycle metadata already used in several inventory responses.
- RBAC permission catalog and seeding.

### 2.6 Existing Gaps Identified

- No commercial assignment layer by branch for contacts.
- No branch assignment layer for price lists.
- No branch assignment layer for promotions.
- No public, official branch commercial context contract for frontend.
- No future-ready path for branch effective pricing without redesign.

## 3. Problem This Improvement Solves

This phase solves a structural problem: the system already had a strong distinction between global business catalog data and branch operational data, but the commercial layer had no branch-scoped assignment model.

That produced a gap between:

- master commercial data that should stay global
- branch-specific commercial availability and preferences

The new design closes that gap by adding branch assignments instead of duplicating entities.

## 4. Design Principles Used

### 4.1 Global Business Entity First

The following entities remain business-wide masters:

- `contacts`
- `price_lists`
- `promotions`

### 4.2 Branch Assignment Layer Second

Branch assignments determine:

- whether the global entity applies in a given branch
- whether it is active there
- whether it is preferred or default there
- branch-specific commercial metadata

### 4.3 Branch Override Layer Third

Branch overrides were intentionally not over-implemented yet.

This phase only prepares the path for future overrides. It does not force them into the data model when assignment-only is enough.

### 4.4 No Duplication Of Global Catalogs

This implementation does not create branch-local copies of:

- contacts
- price lists
- promotions

### 4.5 Strict Tenant And Branch Isolation

All new flows validate:

- `business_id`
- target branch existence inside the same business
- current user branch access where applicable

## 5. Final Model Implemented

## 5.1 Global Entities That Stay Business-Wide

- `contacts`
- `price_lists`
- `promotions`
- `product_prices`
- `products`
- `product_variants`
- `brands`
- `categories`
- `measurement_units`
- `tax_profiles`
- `warranty_profiles`

## 5.2 New Branch Assignment Entities

### 5.2.1 Contact Branch Assignment

Table: `contact_branch_assignments`

Purpose:

- attach branch commercial context to a business-wide contact

Columns:

- `id`
- `business_id`
- `contact_id`
- `branch_id`
- `is_active`
- `is_default`
- `is_preferred`
- `is_exclusive`
- `sales_enabled`
- `purchases_enabled`
- `credit_enabled`
- `custom_credit_limit`
- `custom_price_list_id`
- `account_manager_user_id`
- `notes`
- `created_at`
- `updated_at`

Relations:

- `business_id -> businesses.id`
- `contact_id -> contacts.id`
- `branch_id -> branches.id`
- `custom_price_list_id -> price_lists.id`
- `account_manager_user_id -> users.id`

Indexes and uniqueness:

- unique: `business_id + contact_id + branch_id`
- index: `business_id + branch_id`
- index: `business_id + contact_id`

Lifecycle:

- assignment rows can be activated, deactivated, or deleted
- deleting the assignment removes only the assignment row, not the contact

### 5.2.2 Price List Branch Assignment

Table: `price_list_branch_assignments`

Purpose:

- enable or disable business-wide price lists for a branch
- define the default price list for a branch

Columns:

- `id`
- `business_id`
- `price_list_id`
- `branch_id`
- `is_active`
- `is_default`
- `notes`
- `created_at`
- `updated_at`

Relations:

- `business_id -> businesses.id`
- `price_list_id -> price_lists.id`
- `branch_id -> branches.id`

Indexes and uniqueness:

- unique: `business_id + price_list_id + branch_id`
- index: `business_id + branch_id`
- index: `business_id + price_list_id`

Lifecycle:

- assignment rows can be activated, deactivated, or deleted
- default requires active assignment
- branch default is normalized so only one assignment remains default per branch

### 5.2.3 Promotion Branch Assignment

Table: `promotion_branch_assignments`

Purpose:

- decide whether a business-wide promotion applies to a branch

Columns:

- `id`
- `business_id`
- `promotion_id`
- `branch_id`
- `is_active`
- `notes`
- `created_at`
- `updated_at`

Relations:

- `business_id -> businesses.id`
- `promotion_id -> promotions.id`
- `branch_id -> branches.id`

Indexes and uniqueness:

- unique: `business_id + promotion_id + branch_id`
- index: `business_id + branch_id`
- index: `business_id + promotion_id`

Lifecycle:

- assignment rows can be activated, deactivated, or deleted

## 6. Business Rules Implemented

## 6.1 Contacts

### 6.1.1 Global vs Scoped Behavior

Implemented rule:

- If a contact has no branch assignments in the business, it behaves as global.
- If a contact has at least one branch assignment, it is considered branch-scoped.

Current response contract exposes this explicitly:

```json
{
  "contact_id": 42,
  "mode": "global",
  "global_applies_to_all_branches": true,
  "assignments": []
}
```

or:

```json
{
  "contact_id": 42,
  "mode": "scoped",
  "global_applies_to_all_branches": false,
  "assignments": [ ... ]
}
```

### 6.1.2 Active Assignments

Implemented rule:

- Assignment rows can be active or inactive.
- An inactive assignment remains visible in context responses but should not be treated as operative for future sales or purchases.

### 6.1.3 Preferred And Default Flags

Implemented rule:

- `is_preferred` and `is_default` are stored and returned per branch assignment.

Current limitation of this phase:

- No hard uniqueness rule was enforced for contact defaults per branch because the exact business meaning can vary by contact role and future module.
- Frontend can safely display both flags, but should treat them as advisory metadata in this phase.

### 6.1.4 Exclusive Contact

Implemented rule:

- Only one active exclusive assignment is allowed per contact across the business.
- Creating or updating an active exclusive assignment when another active exclusive assignment exists raises:
  - `CONTACT_BRANCH_EXCLUSIVE_CONFLICT`

Business meaning:

- If a contact is marked as exclusive in one active branch assignment, that contact should be treated as branch-exclusive by future operational modules.

### 6.1.5 Credit

Implemented rule:

- Assignment can enable or disable credit with `credit_enabled`.
- Assignment can define `custom_credit_limit`.

Current limitation:

- No credit engine is implemented in this phase.
- This data is ready for future validation in sales/account-receivable flows.

### 6.1.6 Custom Price List

Implemented rule:

- `custom_price_list_id` may be stored on the branch assignment.
- Backend validates that the referenced price list:
  - exists in the same business
  - is active

Current limitation:

- Backend does not yet require that `custom_price_list_id` is also branch-assigned to that same branch.
- That stricter validation is a recommended future tightening once the effective price engine is implemented.

### 6.1.7 Account Manager

Implemented rule:

- `account_manager_user_id` may be stored on the branch assignment.
- Backend validates that the user:
  - exists in the same business
  - is branch-compatible with the target branch

If the user does not have access to the branch, backend raises:

- `CONTACT_ACCOUNT_MANAGER_BRANCH_SCOPE_INVALID`

## 6.2 Price Lists

### 6.2.1 Price Lists Stay Global

Implemented rule:

- `price_lists` stay business-wide.
- Branch context does not duplicate or mutate the price list master entity.

### 6.2.2 Branch Enablement

Implemented rule:

- Branch assignments indicate which price lists are enabled for a branch.

### 6.2.3 Default Price List Per Branch

Implemented rule:

- A branch can mark one assignment as default.
- Setting one assignment as default unsets the other defaults for that same branch.

### 6.2.4 Active Price Lists Required

Implemented rule:

- A branch assignment cannot be active or default if the price list is inactive.

Errors:

- `PRICE_LIST_INACTIVE`
- `BRANCH_PRICE_LIST_DEFAULT_REQUIRES_ACTIVE_ASSIGNMENT`

## 6.3 Promotions

### 6.3.1 Promotions Stay Global

Implemented rule:

- `promotions` remain business-wide master records.

### 6.3.2 Branch Applicability

Implemented rule:

- Branch assignments indicate whether the promotion applies in a branch.

### 6.3.3 Active Promotion Required

Implemented rule:

- A branch assignment cannot be active if the promotion is inactive.

Error:

- `PROMOTION_INACTIVE`

## 7. Compatibility With Current Pricing

This phase was designed explicitly not to break current pricing.

### 7.1 What Remains Official Today

- `price_lists` remain global catalogs.
- `product_prices` remain publicly managed through product-level endpoints.
- `product_variant_id` on `product_prices` remains an optional refinement row.
- No branch-specific pricing engine is exposed yet.

### 7.2 What This Phase Adds

- branch enablement of price lists
- branch default price list
- branch-level preferred custom price list on contact assignments

### 7.3 What This Phase Does Not Add

- no `branch_id` directly on `price_lists`
- no `branch_id` directly on `product_prices`
- no branch price overrides yet
- no automatic "effective price by branch" endpoint yet

### 7.4 Recommended Future Effective Price Resolution

When future sales or quotation modules need a price engine, the backend should resolve price in this order:

1. Receive `branch_id`, `product_id`, optional `product_variant_id`, optional `price_list_id`, optional quantity, optional contact.
2. Validate that the branch exists and is accessible.
3. If `price_list_id` is provided:
   - validate that the price list exists in the business
   - validate that it is active
   - validate that it is assigned and active for the branch
4. If `price_list_id` is not provided:
   - try `contact_branch_assignment.custom_price_list_id`
   - otherwise use branch default price list
5. Search first for a variant-level price row if `product_variant_id` exists.
6. Fallback to product-level price row.
7. Among valid rows, choose the row with:
   - valid date range
   - compatible minimum quantity
   - highest `min_quantity` that still matches
8. If no valid price is found, return an explicit business error such as:
   - `PRICE_NOT_FOUND_FOR_BRANCH`

That future engine is intentionally documented only. It is not forced into this phase.

## 8. What Was Implemented In This Phase

### 8.1 Contacts By Branch

Implemented:

- list contact branch assignments
- create assignment
- update assignment
- delete assignment
- return `global` vs `scoped` mode
- return branch-level commercial fields

### 8.2 Price Lists By Branch

Implemented:

- list branch assignments for a price list
- list price lists assigned to a branch
- create assignment
- update assignment
- delete assignment
- define one default per branch

### 8.3 Promotions By Branch

Implemented:

- list branch assignments for a promotion
- list promotions assigned to a branch
- create assignment
- update assignment
- delete assignment

### 8.4 Permissions

Implemented new RBAC permissions:

- `contacts.view_branch_assignments`
- `contacts.create_branch_assignment`
- `contacts.update_branch_assignment`
- `contacts.delete_branch_assignment`
- `price_lists.view_branch_assignments`
- `price_lists.create_branch_assignment`
- `price_lists.update_branch_assignment`
- `price_lists.delete_branch_assignment`
- `promotions.view_branch_assignments`
- `promotions.create_branch_assignment`
- `promotions.update_branch_assignment`
- `promotions.delete_branch_assignment`

Seeder compatibility was preserved so existing roles can derive these new permissions from broader legacy permissions where appropriate.

## 9. What Was Left As Future Phase

- effective price engine by branch
- branch validation that `contact.custom_price_list_id` must also be assigned to the same branch
- operational enforcement in future sales/quotation/order flows
- advanced commercial scopes beyond branch assignment
- branch-specific price overrides
- promotion stacking or branch priority strategy
- contact branch assignment resolution by contact type or channel

## 10. Endpoints Added

## 10.1 Contacts

### `GET /contacts/:contact_id/branches`

Purpose:

- retrieve branch commercial context of a contact

Permission:

- `contacts.view_branch_assignments`

Response:

```json
{
  "contact_id": 42,
  "mode": "scoped",
  "global_applies_to_all_branches": false,
  "assignments": [
    {
      "id": 5,
      "business_id": 1,
      "contact_id": 42,
      "branch": {
        "id": 2,
        "code": "SUC-02",
        "name": "Escazu",
        "business_name": "FastFact",
        "branch_number": "002",
        "is_active": true
      },
      "is_active": true,
      "is_default": false,
      "is_preferred": true,
      "is_exclusive": false,
      "sales_enabled": true,
      "purchases_enabled": false,
      "credit_enabled": true,
      "custom_credit_limit": 150000,
      "custom_price_list": {
        "id": 3,
        "code": "PL-RETAIL",
        "name": "Retail",
        "kind": "sale",
        "currency": "CRC",
        "is_active": true
      },
      "account_manager": {
        "id": 12,
        "code": "USR-012",
        "name": "Ana Soto",
        "email": "ana@example.com",
        "status": "active"
      },
      "notes": "Cliente preferente",
      "lifecycle": {
        "can_delete": true,
        "can_deactivate": true,
        "can_reactivate": false,
        "reasons": []
      },
      "created_at": "2026-03-20T00:00:00.000Z",
      "updated_at": "2026-03-20T00:00:00.000Z"
    }
  ]
}
```

### `POST /contacts/:contact_id/branches`

Request:

```json
{
  "branch_id": 2,
  "is_active": true,
  "is_default": false,
  "is_preferred": true,
  "is_exclusive": false,
  "sales_enabled": true,
  "purchases_enabled": true,
  "credit_enabled": true,
  "custom_credit_limit": 150000,
  "custom_price_list_id": 3,
  "account_manager_user_id": 12,
  "notes": "Cliente preferente"
}
```

Response:

- serialized assignment object

Business errors:

- `CONTACT_NOT_FOUND`
- `BRANCH_NOT_FOUND`
- `CONTACT_BRANCH_ASSIGNMENT_DUPLICATE`
- `PRICE_LIST_NOT_FOUND`
- `PRICE_LIST_INACTIVE`
- `USER_NOT_FOUND`
- `CONTACT_ACCOUNT_MANAGER_BRANCH_SCOPE_INVALID`
- `CONTACT_BRANCH_EXCLUSIVE_CONFLICT`

### `PATCH /contacts/:contact_id/branches/:assignment_id`

Request:

- same fields as create, all optional

Response:

- serialized assignment object

### `DELETE /contacts/:contact_id/branches/:assignment_id`

Response:

```json
{
  "id": 5,
  "deleted": true
}
```

## 10.2 Price Lists

### `GET /price-lists/:price_list_id/branches`

Permission:

- `price_lists.view_branch_assignments`

Response:

```json
{
  "price_list_id": 3,
  "assignments": [
    {
      "id": 8,
      "business_id": 1,
      "branch": {
        "id": 2,
        "code": "SUC-02",
        "name": "Escazu",
        "business_name": "FastFact",
        "branch_number": "002",
        "is_active": true
      },
      "price_list": {
        "id": 3,
        "code": "PL-RETAIL",
        "name": "Retail",
        "kind": "sale",
        "currency": "CRC",
        "is_default": false,
        "is_active": true
      },
      "is_active": true,
      "is_default": true,
      "notes": "Lista principal de la sucursal",
      "lifecycle": {
        "can_delete": true,
        "can_deactivate": true,
        "can_reactivate": false,
        "reasons": []
      },
      "created_at": "2026-03-20T00:00:00.000Z",
      "updated_at": "2026-03-20T00:00:00.000Z"
    }
  ]
}
```

### `GET /branches/:branch_id/price-lists`

Purpose:

- list all price lists assigned to the branch and surface the branch default

Response:

```json
{
  "branch_id": 2,
  "default_price_list_id": 3,
  "assignments": [ ... ]
}
```

### `POST /price-lists/:price_list_id/branches`

Request:

```json
{
  "branch_id": 2,
  "is_active": true,
  "is_default": true,
  "notes": "Lista principal de la sucursal"
}
```

Business errors:

- `PRICE_LIST_NOT_FOUND`
- `BRANCH_NOT_FOUND`
- `BRANCH_PRICE_LIST_ASSIGNMENT_DUPLICATE`
- `PRICE_LIST_INACTIVE`
- `BRANCH_PRICE_LIST_DEFAULT_REQUIRES_ACTIVE_ASSIGNMENT`

### `PATCH /price-lists/:price_list_id/branches/:assignment_id`

Request:

```json
{
  "is_active": true,
  "is_default": false,
  "notes": "Actualizacion"
}
```

Important behavior:

- If an assignment is deactivated, backend also clears `is_default`.
- If an assignment is set as default, backend unsets the other defaults for the branch.

### `DELETE /price-lists/:price_list_id/branches/:assignment_id`

Response:

```json
{
  "id": 8,
  "deleted": true
}
```

## 10.3 Promotions

### `GET /promotions/:promotion_id/branches`

Permission:

- `promotions.view_branch_assignments`

Response:

```json
{
  "promotion_id": 9,
  "assignments": [
    {
      "id": 4,
      "business_id": 1,
      "branch": {
        "id": 2,
        "code": "SUC-02",
        "name": "Escazu",
        "business_name": "FastFact",
        "branch_number": "002",
        "is_active": true
      },
      "promotion": {
        "id": 9,
        "code": "PROMO-09",
        "name": "Temporada",
        "type": "percentage",
        "valid_from": "2026-03-01T00:00:00.000Z",
        "valid_to": "2026-03-31T23:59:59.000Z",
        "is_active": true
      },
      "is_active": true,
      "notes": "Solo aplica en sucursales urbanas",
      "lifecycle": {
        "can_delete": true,
        "can_deactivate": true,
        "can_reactivate": false,
        "reasons": []
      },
      "created_at": "2026-03-20T00:00:00.000Z",
      "updated_at": "2026-03-20T00:00:00.000Z"
    }
  ]
}
```

### `GET /branches/:branch_id/promotions`

Response:

```json
{
  "branch_id": 2,
  "assignments": [ ... ]
}
```

### `POST /promotions/:promotion_id/branches`

Request:

```json
{
  "branch_id": 2,
  "is_active": true,
  "notes": "Solo aplica en sucursales urbanas"
}
```

Business errors:

- `PROMOTION_NOT_FOUND`
- `BRANCH_NOT_FOUND`
- `BRANCH_PROMOTION_ASSIGNMENT_DUPLICATE`
- `PROMOTION_INACTIVE`

### `PATCH /promotions/:promotion_id/branches/:assignment_id`

Request:

```json
{
  "is_active": false,
  "notes": "Suspendida para esta sucursal"
}
```

### `DELETE /promotions/:promotion_id/branches/:assignment_id`

Response:

```json
{
  "id": 4,
  "deleted": true
}
```

## 11. Existing Endpoints That Remain Unchanged

These existing endpoints remain official and were not broken by this phase:

### Contacts

- `GET /contacts`
- `POST /contacts`
- `GET /contacts/:id`
- `PATCH /contacts/:id`
- `DELETE /contacts/:id`

### Price Lists

- `GET /price-lists`
- `POST /price-lists`
- `GET /price-lists/:id`
- `PATCH /price-lists/:id`
- `DELETE /price-lists/:id`

### Product Prices

- `GET /products/:id/prices`
- `POST /products/:id/prices`
- `PATCH /product-prices/:id`
- `DELETE /product-prices/:id`

### Promotions

- `GET /promotions`
- `POST /promotions`
- `GET /promotions/:id`
- `PATCH /promotions/:id`
- `DELETE /promotions/:id`

## 12. Frontend Contract

## 12.1 Contact > Branches Tab

Frontend can now build a real "Sucursales" tab under a contact using:

- `GET /contacts/:contact_id/branches`
- `POST /contacts/:contact_id/branches`
- `PATCH /contacts/:contact_id/branches/:assignment_id`
- `DELETE /contacts/:contact_id/branches/:assignment_id`

The table can show:

- branch
- active
- default
- preferred
- exclusive
- sales enabled
- purchases enabled
- credit enabled
- custom credit limit
- custom price list
- account manager
- notes
- actions

UI interpretation:

- `mode = global` means the contact currently applies company-wide.
- `mode = scoped` means assignments now define branch commercial context.
- inactive assignments can still be displayed but should not be used as default commercial options.

## 12.2 Price List > Branches Tab

Frontend can build a "Sucursales" tab under a price list using:

- `GET /price-lists/:price_list_id/branches`
- `POST /price-lists/:price_list_id/branches`
- `PATCH /price-lists/:price_list_id/branches/:assignment_id`
- `DELETE /price-lists/:price_list_id/branches/:assignment_id`

The table can show:

- branch
- active
- default
- notes
- actions

Branch-centric screen can use:

- `GET /branches/:branch_id/price-lists`

## 12.3 Promotion > Branches Tab

Frontend can build a "Sucursales" tab under a promotion using:

- `GET /promotions/:promotion_id/branches`
- `POST /promotions/:promotion_id/branches`
- `PATCH /promotions/:promotion_id/branches/:assignment_id`
- `DELETE /promotions/:promotion_id/branches/:assignment_id`

The table can show:

- branch
- active
- notes
- actions

Branch-centric screen can use:

- `GET /branches/:branch_id/promotions`

## 12.4 Lifecycle Interpretation

Assignment responses now return:

```json
{
  "lifecycle": {
    "can_delete": true,
    "can_deactivate": true,
    "can_reactivate": false,
    "reasons": []
  }
}
```

Frontend rules:

- show Delete if `can_delete = true`
- show Deactivate if `can_deactivate = true`
- show Reactivate if `can_reactivate = true`

For these assignment rows, delete is hard delete of the assignment only.

## 12.5 Error Codes Frontend Should Map

Contacts:

- `CONTACT_NOT_FOUND`
- `CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND`
- `CONTACT_BRANCH_ASSIGNMENT_DUPLICATE`
- `CONTACT_BRANCH_EXCLUSIVE_CONFLICT`
- `CONTACT_ACCOUNT_MANAGER_BRANCH_SCOPE_INVALID`
- `PRICE_LIST_NOT_FOUND`
- `PRICE_LIST_INACTIVE`
- `USER_NOT_FOUND`
- `BRANCH_NOT_FOUND`

Price lists:

- `PRICE_LIST_NOT_FOUND`
- `PRICE_LIST_INACTIVE`
- `BRANCH_NOT_FOUND`
- `BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND`
- `BRANCH_PRICE_LIST_ASSIGNMENT_DUPLICATE`
- `BRANCH_PRICE_LIST_DEFAULT_REQUIRES_ACTIVE_ASSIGNMENT`

Promotions:

- `PROMOTION_NOT_FOUND`
- `PROMOTION_INACTIVE`
- `BRANCH_NOT_FOUND`
- `BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND`
- `BRANCH_PROMOTION_ASSIGNMENT_DUPLICATE`

## 12.6 Suggested Query Invalidation

Contacts:

- invalidate `contacts`
- invalidate `contact(contact_id)`
- invalidate `contact-branches(contact_id)`

Price lists:

- invalidate `price-lists`
- invalidate `price-list(price_list_id)`
- invalidate `price-list-branches(price_list_id)`
- invalidate `branch-price-lists(branch_id)`

Promotions:

- invalidate `promotions`
- invalidate `promotion(promotion_id)`
- invalidate `promotion-branches(promotion_id)`
- invalidate `branch-promotions(branch_id)`

## 13. Operational Rules For Future Modules

### 13.1 Sales Or Quotation By Branch

Future operational behavior should be:

- if a contact has no assignments, treat it as company-global
- if a contact has assignments, only active assignments should make it eligible for the branch
- if a contact has an active exclusive assignment in another branch, the current branch should not use it
- if a contact branch assignment provides `custom_price_list_id`, use it as the first suggested price list
- if no custom price list exists, use the branch default price list if present

### 13.2 Contact Global Without Assignments

Interpretation:

- globally usable
- no branch-specific preference
- no branch-specific pricing preference
- no branch-specific credit policy

### 13.3 Contact With Limited Assignments

Interpretation:

- branch-scoped
- each active assignment defines allowed commercial context for that branch

### 13.4 Contact Exclusive To One Branch

Interpretation:

- only the exclusive branch should use the contact operationally

### 13.5 Contact With Credit Disabled In A Branch

Interpretation:

- contact may still exist globally
- branch-specific commercial policy should not allow credit operations there

### 13.6 Promotion By Branch

Interpretation:

- if a promotion has no assignments, future modules may treat it as globally applicable or require an explicit rollout policy
- if a promotion has assignments, active assignments define branch applicability

Recommended future rule:

- once promotion branch assignment is used operationally, treat assignments as an explicit allow-list when at least one assignment exists

## 14. Real Examples

### Example 1: Contact Global

- Contact exists.
- No branch assignments exist.

Meaning:

- frontend shows `mode = global`
- branch-specific tab may show empty table plus "Aplica globalmente"

### Example 2: Contact Limited To One Branch

- Contact has one assignment for branch 2 with `is_active = true`.

Meaning:

- frontend shows `mode = scoped`
- future operational branch validation should accept branch 2 and reject others

### Example 3: Preferred Contact With Custom Price List

- Contact assignment in branch 2:
  - `is_preferred = true`
  - `custom_price_list_id = 3`

Meaning:

- frontend can surface the contact as preferred in branch 2
- future pricing flow should suggest price list 3 first

### Example 4: Branch Default Price List

- Branch 2 has multiple price list assignments
- One is marked `is_default = true`

Meaning:

- future pricing flow may fallback to that price list if no explicit price list was chosen

### Example 5: Promotion Enabled In One Branch Only

- Promotion has assignments:
  - branch 2 active
  - branch 3 inactive

Meaning:

- future branch pricing or sales validation should apply the promotion only in branch 2

## 15. Files Modified

Core registration:

- `src/config/database.entities.ts`

Contacts:

- `src/modules/contacts/contacts.module.ts`
- `src/modules/contacts/controllers/contact-branch-assignments.controller.ts`
- `src/modules/contacts/dto/create-contact-branch-assignment.dto.ts`
- `src/modules/contacts/dto/update-contact-branch-assignment.dto.ts`
- `src/modules/contacts/entities/contact-branch-assignment.entity.ts`
- `src/modules/contacts/repositories/contact-branch-assignments.repository.ts`
- `src/modules/contacts/services/contact-branch-assignments.service.ts`

Inventory:

- `src/modules/inventory/inventory.module.ts`
- `src/modules/inventory/controllers/branch-price-lists.controller.ts`
- `src/modules/inventory/controllers/branch-promotions.controller.ts`
- `src/modules/inventory/controllers/price-list-branch-assignments.controller.ts`
- `src/modules/inventory/controllers/promotion-branch-assignments.controller.ts`
- `src/modules/inventory/dto/create-price-list-branch-assignment.dto.ts`
- `src/modules/inventory/dto/update-price-list-branch-assignment.dto.ts`
- `src/modules/inventory/dto/create-promotion-branch-assignment.dto.ts`
- `src/modules/inventory/dto/update-promotion-branch-assignment.dto.ts`
- `src/modules/inventory/entities/price-list-branch-assignment.entity.ts`
- `src/modules/inventory/entities/promotion-branch-assignment.entity.ts`
- `src/modules/inventory/repositories/price-list-branch-assignments.repository.ts`
- `src/modules/inventory/repositories/promotion-branch-assignments.repository.ts`
- `src/modules/inventory/services/price-list-branch-assignments.service.ts`
- `src/modules/inventory/services/promotion-branch-assignments.service.ts`

RBAC and error messaging:

- `src/modules/common/enums/permission-key.enum.ts`
- `src/modules/common/i18n/error-translations.ts`
- `src/modules/rbac/services/rbac-seed.service.ts`

## 16. Verification

Validation executed after implementation:

- `npm run lint`
- `npm run build`
- `npm test -- --runInBand`

All three passed successfully at the end of this phase.

## 17. Recommended Next Steps

1. Implement effective branch price resolution service without breaking the current public pricing contract.
2. Add stricter validation requiring contact `custom_price_list_id` to also be assigned to the same branch when commercial engine becomes active.
3. Add branch-aware operational validation helpers for future quotation, order, invoice, and POS flows.
4. Decide whether contact `is_default` should become uniquely enforced by branch and contact role once the consuming modules exist.
5. Add a future branch override layer only if real commercial use cases require branch-specific price row exceptions.
