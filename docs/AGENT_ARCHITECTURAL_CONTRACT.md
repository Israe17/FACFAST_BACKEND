# Agent Architectural Contract

## Purpose

This document is the operational architecture contract for agents that need to
work on this backend without guessing how the project is structured.

It is not only a high-level overview. It defines:

- what the system is made of
- where each kind of logic is supposed to live
- what cross-module dependencies are allowed
- how reads and writes are expected to behave
- how agents should split ownership safely

This document is intended to be the first read for any agent that will edit the
repo.

Related references:

- [BACKEND_ARCHITECTURE_RFC.md](./BACKEND_ARCHITECTURE_RFC.md)
- [SALE_ORDER_RESERVATION_ARCHITECTURE.md](./SALE_ORDER_RESERVATION_ARCHITECTURE.md)
- [inventory-backend-consolidation-and-frontend-contract.md](./inventory-backend-consolidation-and-frontend-contract.md)
- [FRONTEND_FORM_OPERATIONAL_CONTRACT.md](./FRONTEND_FORM_OPERATIONAL_CONTRACT.md)
- [FRONTEND_BACKEND_EDITABLE_RESOURCE_CONTRACT.md](./FRONTEND_BACKEND_EDITABLE_RESOURCE_CONTRACT.md)

---

## System Snapshot

### Runtime stack

- NestJS
- TypeORM
- PostgreSQL
- `ValidationPipe` global with:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`
  - `enableImplicitConversion: true`

Bootstrap references:

- `src/main.ts`
- `src/configure-app.ts`
- `src/app.module.ts`

### Top-level source layout

```text
src/
  config/
  modules/
  scripts/
  app.module.ts
  configure-app.ts
  main.ts
```

### Top-level bounded contexts

```text
src/modules/
  auth/
  branches/
  businesses/
  common/
  contacts/
  inventory/
  platform/
  rbac/
  sales/
  users/
```

---

## Global Architectural Contract

Every module is expected to converge to this shape:

```text
controllers -> use-cases -> policies -> repositories -> serializers/contracts
```

### Layer responsibilities

#### `controllers/`

- HTTP boundary only
- parse params/body/query
- call a service or use case
- never own business logic

#### `use-cases/`

- command orchestration for writes
- query orchestration for reads
- transaction boundaries
- enforce workflow sequencing
- call policies and repositories

#### `policies/`

- access checks
- lifecycle transitions
- cross-module domain rules
- consistency rules that should not live in controllers or repositories

#### `repositories/`

- all data access and query composition
- tenant filtering
- branch scoping
- joins and locks
- collection replacement helpers when a document owns child rows

#### `serializers/` + `contracts/`

- public output contract
- stable response shape for frontend and agents
- no controller should shape response ad hoc

#### `services/`

- thin facades
- shared domain helpers
- validation services
- worker/integration orchestration
- should not become giant workflow containers

---

## Mandatory System Rules

### 1. Tenant awareness

Every tenant-owned resource is scoped by `business_id`.

Where applicable, branch-scoped data also carries `branch_id`.

Agents must assume that:

- reads must be filtered by business
- writes must validate business ownership before persistence
- branch access must be checked through policies, not inferred ad hoc

### 2. Writes follow this sequence

For mutable flows, the expected pattern is:

1. resolve effective tenant context
2. load aggregate or owned resource
3. validate access
4. validate lifecycle transition
5. validate cross-module references
6. persist
7. reload if response needs relations
8. serialize

### 3. Reads go through query use cases

Agents should not add controller-side read orchestration or raw repository calls
from controllers.

### 4. Responses are contract-first

`POST/PATCH` responses should converge to the same shape as detail `GET`
responses for the same resource, especially when the frontend edits the result
immediately after mutation.

### 5. Collections have explicit semantics

This repo now distinguishes two patterns:

#### Replace-all collections

The full collection is sent in one payload and replaces the existing set.

Current important examples:

- sale order `lines`
- sale order `delivery_charges`
- promotion `items`

#### Subresource-managed collections

The parent resource does not own the collection inside its base update DTO; the
collection is managed through dedicated endpoints, but each subresource call
still replaces the full assigned set that it owns.

Current important examples:

- user roles
- user branch access
- role permissions
- dispatch stops
- dispatch expenses
- branch assignments for contacts, promotions, price lists, zones, routes and vehicles

### 6. `null` must mean something real

If an update DTO accepts `field?: string | null`, agents must preserve the rule:

- `undefined` => leave as-is
- `null` => clear the stored value

Do not reintroduce `if (dto.field)` style updates on nullable contracts.

### 7. Lifecycle flags must not lie

`lifecycle.can_delete`, `can_edit`, `can_dispatch`, etc. must reflect either:

- a real computed capability
- or a conservative capability

Never expose optimistic lifecycle flags that the backend action will contradict
immediately.

### 8. Cross-module FK validation is mandatory for important references

For business-critical foreign keys, agents must validate ownership and
operational coherence before persistence.

This is mandatory especially for:

- `branch_id`
- `customer_contact_id`
- `seller_user_id`
- `warehouse_id`
- `delivery_zone_id`
- `product_variant_id`
- `price_list_id`
- `route_id`
- `vehicle_id`
- `driver_user_id`
- `origin_warehouse_id`

Rule:

- do not rely on database FK failure as the business validation mechanism
- use the corresponding validation service or policy
- if the FK crosses bounded contexts, the validation must be explicit in the
  use case flow

### 9. Reload-after-save is mandatory when serializers need relations

If the serializer contract depends on related entities, the write flow must:

1. save
2. reload through the repository with the required relations
3. serialize the reloaded entity

This is mandatory for editable resources and any mutation response expected to
match detail `GET`.

Do not serialize half-hydrated entities after mutation if the detail contract
expects related objects or lifecycle computed from persisted state.

### 10. Editable detail responses must be frontend-ready

For resources that back create/edit/reopen forms, detail `GET` must be treated
as an editing contract, not only as a read model.

Minimum expectation:

- scalar ids for every editable FK
- minimal nested label objects for current selections
- child collections in the same structure the form expects
- lifecycle block
- timestamps
- any additional state needed to reopen or continue editing without guessing

### 11. Pessimistic locks must scope to the main table

When using `setLock('pessimistic_write')` on a query that includes
`leftJoinAndSelect`, the lock MUST be scoped to the main table using the third
parameter. PostgreSQL rejects `FOR UPDATE` on the nullable side of a LEFT JOIN.

```typescript
// WRONG — will crash with "FOR UPDATE cannot be applied to the nullable side of an outer join"
.createQueryBuilder('entity')
.setLock('pessimistic_write')
.leftJoinAndSelect('entity.relation', 'relation')

// CORRECT — lock only the main table
.createQueryBuilder('entity')
.setLock('pessimistic_write', undefined, ['entity'])
.leftJoinAndSelect('entity.relation', 'relation')
```

Rule:

- if the query has any `leftJoinAndSelect`, always pass the third parameter
- if the query has no joins, the third parameter is optional but harmless
- the table name in the array is the **alias** used in `createQueryBuilder`

Rule:

- the frontend should not need to fully reload every catalog only to paint the
  current label of an already selected relation
- if a resource is editable, its detail response must make edit hydration
  straightforward

---

## Bounded Context Map

### `common/`

Shared infrastructure and base abstractions.

Contains:

- error system
- filters
- middleware
- idempotency
- outbox
- pagination
- base interfaces
- shared utilities

High-value files:

- `src/modules/common/application/interfaces/`
- `src/modules/common/services/idempotency.service.ts`
- `src/modules/common/services/outbox.service.ts`
- `src/modules/common/utils/query-builder.util.ts`
- `src/modules/common/utils/tenant-context.util.ts`

### `auth/`

Authentication and refresh-token flow.

Scope:

- login/session lifecycle
- refresh tokens
- authenticated user context

### `businesses/`

Business entity and business-level configuration.

This is a low-level core domain used by many other contexts but should remain
small and stable.

### `branches/`

Commercial/operational branch structure and terminals.

Scope:

- branches
- branch identity/configuration
- terminals
- branch-level access checks

Important rule:

- branch lifecycle is constrained by operational dependencies

### `rbac/`

Permissions and roles.

Scope:

- permissions catalog
- business roles
- role lifecycle
- role-permission assignments

Important rule:

- roles are domain configuration, not user state

### `users/`

User accounts and assignment of roles/branch access.

Scope:

- user identity
- login capability/status
- role assignments
- branch access assignments

Important rule:

- users depend on `rbac` and `branches`, not the other way around

### `contacts/`

Business contacts and their commercial/branch assignments.

Scope:

- contacts
- contact branch assignments

Important rule:

- base contact identity stays separate from branch-specific commercial context

### `inventory/`

Largest bounded context.

This is not a flat module. It is a composition of submodules.

See dedicated map below.

### `sales/`

Commercial sales document flow.

Scope:

- sale orders
- sale order lines
- delivery charges
- confirmation/cancellation
- reservation handoff into inventory
- electronic documents

Important domain rule:

- sale order is the commercial document
- dispatch order is the logistics document
- they are related but not merged

### `platform/`

Platform-level operations outside normal tenant business flows.

Use this only for platform-admin concerns, never as a shortcut for tenant logic.

---

## Inventory Internal Topology

`inventory.module.ts` is an orchestrator over several submodules.

```text
InventoryModule
  -> DispatchCatalogValidationSubModule
  -> ProductsSubModule
  -> PricingSubModule
  -> PromotionsSubModule
  -> WarehousingSubModule
  -> MovementsSubModule
  -> DispatchSubModule
```

### Validation submodules

These are shared domain validation modules and should remain cross-cutting.

#### `inventory-validation.sub-module.ts`

Shared inventory validation:

- products
- variants
- warehouses
- locations
- price lists
- tax profiles
- measurement units
- warranty profiles
- inventory ownership/compatibility

#### `pricing-validation.sub-module.ts`

Shared pricing validation:

- price lists
- product prices
- promotions

#### `dispatch-catalog-validation.sub-module.ts`

Shared dispatch catalog validation:

- routes
- vehicles
- zones
- driver users
- origin warehouse
- branch assignment scope for dispatch catalogs

### `ProductsSubModule`

Owns product catalog core.

Scope:

- products
- variants
- serials
- tax profiles
- warranty profiles
- measurement units
- brands
- categories
- variant attributes

### `PricingSubModule`

Owns commercial price structures.

Scope:

- price lists
- product prices
- branch assignments for price lists

### `PromotionsSubModule`

Owns promotion definition and branch assignments.

Scope:

- promotions
- promotion items
- promotion branch assignments

### `WarehousingSubModule`

Owns physical warehouse structure and stock read models.

Scope:

- warehouses
- warehouse locations
- warehouse stock
- zones
- branch-aware catalog assignment for zones/warehouses

### `MovementsSubModule`

Owns inventory mutation flows.

Scope:

- inventory lots
- inventory movements
- reservations
- adjustments
- transfers
- inventory ledger side effects

### `DispatchSubModule`

Owns logistics execution.

Scope:

- routes
- vehicles
- dispatch orders
- dispatch stops
- dispatch expenses

Important domain rule:

- dispatch is fulfillment/logistics
- it may aggregate one or many confirmed delivery sale orders

---

## Allowed Dependency Directions

These are the intended dependency directions agents should preserve.

### Safe directions

- `users -> rbac`
- `users -> branches`
- `contacts -> branches`
- `sales -> inventory`
- `sales -> contacts`
- `sales -> branches`
- `sales -> users`
- `inventory.dispatch -> sales`
- `inventory.pricing -> inventory.products`
- `inventory.warehousing -> inventory.products`
- `inventory.movements -> inventory.products`
- `inventory.dispatch -> inventory.warehousing`
- `inventory.dispatch -> inventory.movements`

### Shared cross-cutting validation

Cross-slice references should prefer dedicated validation services instead of
pulling repositories directly across bounded contexts when a stable validation
service already exists.

Examples:

- `SalesValidationService`
- `InventoryValidationService`
- `PricingValidationService`
- `DispatchCatalogValidationService`
- `ContactsValidationService`
- `RbacValidationService`

### Avoid unless already established and necessary

- controllers calling repositories directly
- repositories reaching into other repositories to enforce business policy
- circular dependencies between high-level services
- putting workflow logic in serializers
- adding new `SubModule` imports just to reuse one query that belongs in a validation service

---

## Contract by Change Type

### When adding a new write flow

Agents should create:

- a command use case
- access/lifecycle policy checks if applicable
- repository methods for data access
- serializer/contract if the resource is returned

If the flow mutates state with concurrency risk, it should use:

- explicit transaction
- reload-after-save if relations are needed in the response

### When adding a new read flow

Agents should create:

- a query use case
- repository query or projection
- serializer output contract

### When adding a child collection

Agents must choose one of two contracts up front:

#### Option A: replace-all collection

Use when the parent form owns the whole list.

Requirements:

- DTO must describe replace semantics
- repository should expose explicit `replace_*` helper
- omission keeps existing collection
- empty array clears only if that is a valid domain action

#### Option B: subresource collection

Use when the collection is operational or independently managed.

Requirements:

- use dedicated endpoints
- keep base parent update DTO free of that collection
- document whether each call replaces the full set or appends/removes one item

---

## Current Collection Contract Matrix

### Replace-all

- `sale-orders.lines`
- `sale-orders.delivery_charges`
- `promotions.items`

### Subresource-managed, full-set replacement per call

- `users/:id/roles`
- `users/:id/branches`
- `roles/:id/permissions`

### Subresource-managed, item-level operational actions

- `dispatch-orders/:id/stops`
- `dispatch-orders/:id/expenses`
- branch assignment item endpoints for contacts/promotions/price lists

---

## Critical Domain Flows Agents Must Understand

### 1. Sale order lifecycle

Commercial document owned by `sales`.

Core states:

- draft
- confirmed
- cancelled

Fulfillment tracking lives in `dispatch_status`, not in the main commercial
state.

Important rules:

- `pickup` does not require dispatch
- `delivery` becomes pending for logistics
- confirmation reserves stock but does not create dispatch by default

### 2. Dispatch order lifecycle

Logistics document owned by `inventory/dispatch`.

Core states:

- draft
- ready
- dispatched
- in_transit
- completed
- cancelled

Important rules:

- only confirmed delivery sale orders may enter dispatch
- one sale order cannot belong to two active dispatches
- dispatch owns route, vehicle, driver, stops and execution

### 3. Inventory mutation lifecycle

Owned by `inventory/movements`.

Important rules:

- stock reservations and physical stock movement are not the same event
- movements, lots and reservations must remain batch-safe and tenant-safe

### 4. Role/user assignment lifecycle

Owned across `rbac` and `users`.

Important rules:

- role definition belongs to `rbac`
- role assignment belongs to `users`
- branch access belongs to `users`

---

## Response Contract Rules Agents Must Preserve

### Detail responses

Prefer returning:

- scalar FK ids
- minimal label objects
- lifecycle block
- timestamps

For editable resources, detail responses should also include:

- form-owned child collections already normalized for edit hydration
- current selection labels for related entities
- enough information to reopen dialogs without waiting for catalog fetches

Minimal nested label object pattern:

```json
{
  "branch_id": 3,
  "branch": {
    "id": 3,
    "code": "BR-0003",
    "name": "Heredia"
  }
}
```

Agents should prefer this shape over returning only the scalar FK for editable
screens.

### Mutation responses

Prefer returning the same contract as detail `GET`.

If the resource is editable in frontend:

- `POST` should return a detail-grade payload
- `PATCH` should return a detail-grade payload
- if the serializer requires relations, reload-after-save is mandatory

### Lifecycle exposure

If lifecycle requires dependency counting:

- either compute it accurately
- or return a conservative false

Never expose optimistic flags that the mutation endpoint will reject for known
reasons.

---

## Recommended Agent Partition

Use these partitions when spawning multiple agents in parallel.

### Agent A: platform + bootstrap + common

Owns:

- `src/app.module.ts`
- `src/configure-app.ts`
- `src/config/*`
- `src/modules/common/*`
- `src/modules/platform/*`
- `src/modules/auth/*`

Best for:

- app bootstrapping
- guards/middleware/filters
- idempotency/outbox
- global validation or app policy changes

### Agent B: organization and access

Owns:

- `src/modules/branches/*`
- `src/modules/rbac/*`
- `src/modules/users/*`

Best for:

- branch rules
- roles/permissions
- user management
- access and lifecycle flags

### Agent C: contacts and commercial identity

Owns:

- `src/modules/contacts/*`

Best for:

- contacts
- branch assignments for contacts
- customer/supplier commercial identity

### Agent D: sales and electronic documents

Owns:

- `src/modules/sales/*`

Best for:

- sale order flows
- sales document lifecycle
- reservation handoff
- electronic document issuance

### Agent E: inventory catalog and pricing

Owns:

- `src/modules/inventory/products.sub-module.ts`
- `src/modules/inventory/pricing.sub-module.ts`
- `src/modules/inventory/promotions.sub-module.ts`
- validation submodules related to products/pricing

Best for:

- products
- variants
- price lists
- product prices
- promotions

### Agent F: warehousing and inventory movements

Owns:

- `src/modules/inventory/warehousing.sub-module.ts`
- `src/modules/inventory/movements.sub-module.ts`
- shared inventory validation when directly related

Best for:

- warehouses
- locations
- stock projections
- lots
- movements
- reservations
- transfers

### Agent G: fulfillment and dispatch

Owns:

- `src/modules/inventory/dispatch.sub-module.ts`
- `src/modules/inventory/dispatch-catalog-validation.sub-module.ts`

Best for:

- routes
- vehicles
- zones
- dispatch orders
- stops
- expenses
- dispatch/sales logistics boundary

### Parallelization guidance

Safe parallel groupings:

- `Agent B` with `Agent D`
- `Agent C` with `Agent E`
- `Agent F` with `Agent G`

High-coordination areas:

- `sales` <-> `inventory/movements`
- `sales` <-> `inventory/dispatch`
- `users` <-> `rbac`
- `inventory/products` <-> `inventory/pricing`

When multiple agents work in these boundaries, define write ownership by file
set before editing.

---

## Safe Edit Rules for Agents

Before editing, an agent should always determine:

1. which bounded context owns the rule
2. whether the change is read-side or write-side
3. whether the change affects lifecycle
4. whether it changes collection semantics
5. whether the response contract used by the frontend changes

### Do

- add logic in use cases or policies
- centralize child collection replacement in repositories
- use validation services for cross-context checks
- reload entities after save when serializers require relations
- keep DTO semantics explicit

### Do not

- add business logic to controllers
- hide domain mutations inside serializers
- bypass policies just because a repository already filters by tenant
- let `null` be accepted in DTOs without meaningful persistence behavior
- mix dispatch logistics state into sales commercial state

---

## Checklist for Any New Agent

Before answering deep questions or editing code, the agent should read:

1. `src/app.module.ts`
2. `src/configure-app.ts`
3. `docs/BACKEND_ARCHITECTURE_RFC.md`
4. this document
5. the target module file
6. the target module's repository/policy/use-case files

For `inventory` work, also read:

1. `src/modules/inventory/inventory.module.ts`
2. the relevant submodule file
3. the shared validation submodule if the feature crosses slices

For `sales` + fulfillment work, also read:

1. `docs/SALE_ORDER_RESERVATION_ARCHITECTURE.md`
2. `src/modules/sales/use-cases/confirm-sale-order.use-case.ts`
3. `src/modules/inventory/use-cases/create-dispatch-order.use-case.ts`
4. `src/modules/inventory/use-cases/mark-dispatch-order-dispatched.use-case.ts`
5. `src/modules/inventory/use-cases/update-dispatch-stop-status.use-case.ts`

---

## Final Rule

If an agent is unsure where a rule belongs, the decision order is:

1. owning bounded context
2. use case orchestration
3. policy validation
4. repository persistence helper
5. serializer contract

If the agent still cannot place the logic cleanly, it should stop and document
the ambiguity instead of introducing a shortcut dependency.
