# Agent Boot Sequence

## Purpose

This document tells an agent how to start working in this repository without
getting lost, duplicating work, or breaking architectural boundaries.

Use it together with:

- [AGENT_ARCHITECTURAL_CONTRACT.md](./AGENT_ARCHITECTURAL_CONTRACT.md)
- [BACKEND_ARCHITECTURE_RFC.md](./BACKEND_ARCHITECTURE_RFC.md)

This file is optimized for multi-agent work.

It gives:

- a common startup sequence for any agent
- specialization-specific reading orders
- prompt templates for spawning focused agents
- a handoff format so agents can collaborate cleanly

---

## Core Rule

Every agent must do two things before editing:

1. understand the owning bounded context
2. identify whether the task is:
   - read-side
   - write-side
   - lifecycle
   - response contract
   - cross-context validation

If that is not clear yet, the agent is not ready to patch code.

---

## Universal Boot Sequence

Every agent should follow this order.

### Step 1. Read global architecture

Mandatory first reads:

1. `docs/AGENT_ARCHITECTURAL_CONTRACT.md`
2. `docs/BACKEND_ARCHITECTURE_RFC.md`
3. `src/app.module.ts`
4. `src/configure-app.ts`

Purpose:

- understand bounded contexts
- understand Nest module composition
- understand global validation behavior
- understand the baseline layering contract

### Step 2. Identify bounded context ownership

Before opening random files, answer:

- Which module owns the business rule?
- Is this really one module, or a boundary between two?
- Is there already a validation service or policy for this concern?

### Step 3. Open the module entry point

Read the owning module file first:

- `src/modules/<context>/<context>.module.ts`
- or, for inventory, the relevant `*.sub-module.ts`

Purpose:

- identify controllers
- identify use cases
- identify repositories
- identify services and policies
- identify cross-module imports and exports

### Step 4. Map the runtime path

For any real task, follow the flow:

1. controller
2. dto
3. service or use case
4. policy
5. repository
6. serializer
7. contract

If the task is a mutation, also identify:

- transaction boundary
- reload-after-save behavior
- lifecycle block
- collection semantics

### Step 5. Check shared validation

Before adding new cross-module lookups, search for an existing validation
service:

- `SalesValidationService`
- `InventoryValidationService`
- `PricingValidationService`
- `DispatchCatalogValidationService`
- `ContactsValidationService`
- `RbacValidationService`

Rule:

- prefer extending existing validation services over adding new direct
  repository coupling across contexts

### Step 6. Check existing docs for the feature area

Read domain docs when the task touches those areas:

- sales/dispatch/reservations:
  `docs/SALE_ORDER_RESERVATION_ARCHITECTURE.md`
- inventory alignment:
  `docs/inventory-backend-consolidation-and-frontend-contract.md`

### Step 7. Produce a preflight summary before deep editing

The agent should summarize:

- owning context
- affected files
- expected collection semantics
- expected lifecycle implications
- expected response contract implications
- likely risks

This summary should be short and concrete.

---

## Required Preflight Output

Before a large patch, the agent should be able to state something like:

```text
Owning context: sales
Boundary touched: sales <-> inventory
Mutation or query: mutation
Lifecycle impact: yes, order/editable/confirm flow
Collection semantics: replace-all for lines and delivery charges
Response impact: detail contract must stay aligned after save
Main files: use-case, repository, serializer, dto
Risk: cross-context inventory validation and dispatch_status coherence
```

If the agent cannot produce this, it probably has not read enough.

---

## Specialization Boot Sequences

These sequences tell each agent what to read first depending on its role.

## Agent A: Core Platform Agent

### Scope

- app bootstrap
- config
- common infrastructure
- auth
- platform

### Read order

1. `src/app.module.ts`
2. `src/configure-app.ts`
3. `src/modules/common/*`
4. `src/modules/auth/auth.module.ts`
5. `src/modules/platform/platform.module.ts`

### Focus questions

- Is this concern global or tenant-specific?
- Does the task belong in common, auth, or a business module?
- Does it affect validation, guards, filters, middleware, idempotency, or outbox?

### Prompt template

```text
You are the Core Platform Agent for this NestJS backend.

Your ownership is:
- src/app.module.ts
- src/configure-app.ts
- src/config/*
- src/modules/common/*
- src/modules/auth/*
- src/modules/platform/*

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. docs/BACKEND_ARCHITECTURE_RFC.md
3. src/app.module.ts
4. src/configure-app.ts

Rules:
- do not push business logic into common unless it is truly cross-context
- preserve global ValidationPipe semantics
- preserve idempotency/outbox patterns where already used
- avoid introducing tenant logic into platform-only modules

Before editing, return:
- ownership confirmation
- runtime path
- affected global behavior
- risk notes
```

---

## Agent B: Organization and Access Agent

### Scope

- branches
- rbac
- users

### Read order

1. `src/modules/branches/branches.module.ts`
2. `src/modules/rbac/rbac.module.ts`
3. `src/modules/users/users.module.ts`
4. related policies
5. related serializers

### Focus questions

- Is this a branch rule, role rule, or user-assignment rule?
- Is lifecycle computed conservatively and accurately?
- Is access managed by policy rather than ad hoc checks?

### Prompt template

```text
You are the Organization and Access Agent.

Your ownership is:
- src/modules/branches/*
- src/modules/rbac/*
- src/modules/users/*

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. src/modules/branches/branches.module.ts
3. src/modules/rbac/rbac.module.ts
4. src/modules/users/users.module.ts

Rules:
- roles belong to rbac, not users
- role assignment belongs to users
- branch access belongs to users
- lifecycle flags must not lie
- if a DTO allows null clearing, preserve it consistently

Before editing, return:
- owning context
- whether the change affects lifecycle, access, or assignments
- whether the affected collection is replace-all or subresource-managed
```

---

## Agent C: Contacts Agent

### Scope

- contacts
- contact branch assignments

### Read order

1. `src/modules/contacts/contacts.module.ts`
2. contact use cases
3. contact branch assignment use cases
4. contact lifecycle policy
5. contact serializer and contracts

### Focus questions

- Is the change about base contact identity or branch-specific commercial context?
- Should the contract stay in the base contact resource or remain in branch-assignment subresources?

### Prompt template

```text
You are the Contacts Agent.

Your ownership is:
- src/modules/contacts/*

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. src/modules/contacts/contacts.module.ts
3. contact serializers, policies, repositories and use cases

Rules:
- do not collapse contact identity and branch assignment into one mixed model
- preserve contact lifecycle consistency
- preserve response contracts used by sales and inventory

Before editing, return:
- whether the task belongs to contact identity or branch assignment
- whether response enrichment belongs in base detail or separate subresource
```

---

## Agent D: Sales Agent

### Scope

- sale orders
- sale order lines
- delivery charges
- sale lifecycle
- electronic documents

### Read order

1. `docs/SALE_ORDER_RESERVATION_ARCHITECTURE.md`
2. `src/modules/sales/sales.module.ts`
3. sale order use cases
4. sale order policies
5. sale order repository
6. serializers and contracts

### Focus questions

- Is the rule commercial or logistical?
- Does the change affect stock reservation?
- Does the change affect dispatch boundary?
- Is the child collection replace-all?

### Prompt template

```text
You are the Sales Agent.

Your ownership is:
- src/modules/sales/*

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. docs/SALE_ORDER_RESERVATION_ARCHITECTURE.md
3. src/modules/sales/sales.module.ts

Rules:
- sale order is the commercial document
- dispatch order is the logistics document
- do not move route/vehicle/driver logic into sales
- preserve replace-all semantics for lines and delivery charges
- preserve reservation behavior on confirmation/cancellation

Before editing, return:
- whether the change is commercial, fulfillment tracking, or inventory-boundary related
- affected state machine
- response contract impact
```

---

## Agent E: Inventory Catalog and Pricing Agent

### Scope

- products
- variants
- serials
- brands
- categories
- measurement units
- tax profiles
- warranty profiles
- price lists
- product prices
- promotions

### Read order

1. `src/modules/inventory/inventory.module.ts`
2. `src/modules/inventory/products.sub-module.ts`
3. `src/modules/inventory/pricing.sub-module.ts`
4. `src/modules/inventory/promotions.sub-module.ts`
5. validation submodules

### Focus questions

- Is the rule catalog, pricing, or promotion-specific?
- Does a validation already belong in `InventoryValidationService` or `PricingValidationService`?
- Is the child collection replace-all, like promotion items?

### Prompt template

```text
You are the Inventory Catalog and Pricing Agent.

Your ownership is:
- src/modules/inventory/products.sub-module.ts
- src/modules/inventory/pricing.sub-module.ts
- src/modules/inventory/promotions.sub-module.ts
- related repositories, services, policies, serializers, dto and use cases

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. src/modules/inventory/inventory.module.ts
3. the relevant inventory submodule

Rules:
- preserve validation-service boundaries
- do not mix pricing rules into raw product catalog services unless the domain truly requires it
- promotion items are replace-all
- reload entities after save when serializers need relations

Before editing, return:
- owning slice
- whether the task is catalog, pricing, or promotion logic
- validation and response contract impact
```

---

## Agent F: Warehousing and Inventory Movements Agent

### Scope

- warehouses
- locations
- warehouse stock
- zones
- lots
- inventory movements
- reservations
- transfers

### Read order

1. `src/modules/inventory/inventory.module.ts`
2. `src/modules/inventory/warehousing.sub-module.ts`
3. `src/modules/inventory/movements.sub-module.ts`
4. `inventory-validation.sub-module.ts`

### Focus questions

- Is the flow read-side stock projection or write-side inventory mutation?
- Does the task affect lots, reservations, or physical stock?
- Is the response detail complete after mutation?

### Prompt template

```text
You are the Warehousing and Inventory Movements Agent.

Your ownership is:
- src/modules/inventory/warehousing.sub-module.ts
- src/modules/inventory/movements.sub-module.ts
- related inventory validation

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. src/modules/inventory/inventory.module.ts
3. warehousing and movements submodules

Rules:
- respect the separation between warehouse structure, stock projections and stock mutations
- reservations and physical movements are not the same event
- preserve batch-safe patterns in inventory ledger and movement flows
- preserve reload-after-save when serializers need related entities

Before editing, return:
- whether the change affects stock projection, lot tracking, reservation logic, or movement posting
- concurrency or transaction risks
```

---

## Agent G: Fulfillment and Dispatch Agent

### Scope

- routes
- vehicles
- zones
- dispatch orders
- stops
- expenses
- dispatch logistics boundary with sales

### Read order

1. `docs/AGENT_ARCHITECTURAL_CONTRACT.md`
2. `docs/SALE_ORDER_RESERVATION_ARCHITECTURE.md`
3. `src/modules/inventory/dispatch.sub-module.ts`
4. `src/modules/inventory/dispatch-catalog-validation.sub-module.ts`
5. dispatch use cases and policies

### Focus questions

- Is the rule about catalog setup or execution lifecycle?
- Is the sale order boundary being respected?
- Is the stop-level logic the true source of dispatch resolution?

### Prompt template

```text
You are the Fulfillment and Dispatch Agent.

Your ownership is:
- src/modules/inventory/dispatch.sub-module.ts
- src/modules/inventory/dispatch-catalog-validation.sub-module.ts
- routes, vehicles, zones, dispatch orders, stops and expenses

Read first:
1. docs/AGENT_ARCHITECTURAL_CONTRACT.md
2. docs/SALE_ORDER_RESERVATION_ARCHITECTURE.md
3. src/modules/inventory/dispatch.sub-module.ts

Rules:
- dispatch is the logistics document
- sale order is the commercial document
- do not move route/vehicle/driver logic into sales
- preserve one-sale-order-per-active-dispatch constraint
- preserve stop-driven completion semantics

Before editing, return:
- whether the task touches dispatch setup, dispatch execution, or sales boundary rules
- lifecycle implications
- cross-context validation implications
```

---

## Multi-Agent Coordination Protocol

Use this protocol when several agents are working at once.

### 1. Assign ownership by file set

Before editing, define who owns:

- exact directories
- exact files if sharing a module
- whether shared validation services are in or out of scope

### 2. Declare boundary files

If two agents touch the same boundary, explicitly call it out.

Common boundary files:

- `src/app.module.ts`
- `src/configure-app.ts`
- validation submodules in `inventory`
- shared serializer/contracts used by multiple modules
- `query-builder.util.ts`

### 3. Separate write scopes

Best practice:

- one agent owns write-side flow
- another owns read-side/serializer enrichment
- another owns tests

Only split this way if write scopes are disjoint.

### 4. Handoff before merge

Every agent should hand off:

- what changed
- what contract changed
- what lifecycle changed
- what collection semantics changed
- what tests/build were run
- any known residual risks

---

## Standard Handoff Format

Use this exact structure for agent reports:

```text
Ownership:
- bounded context
- files touched

Change type:
- query / mutation / lifecycle / contract / validation

Architectural impact:
- policies affected
- repositories affected
- serializers/contracts affected
- collection semantics affected

Verification:
- build
- tests

Risks:
- residual ambiguities
- cross-context follow-ups
```

---

## Quick Prompt Pack

These are shorter prompts for fast spawning.

### Fast prompt: architecture-aware explorer

```text
Read docs/AGENT_ARCHITECTURAL_CONTRACT.md first.
Then inspect the owning module only.
Return:
- bounded context ownership
- runtime path (controller -> dto -> use-case/service -> policy -> repository -> serializer)
- lifecycle implications
- collection semantics
- response contract implications
Do not propose code before mapping the runtime path.
```

### Fast prompt: safe patch worker

```text
Read docs/AGENT_ARCHITECTURAL_CONTRACT.md and the target module entry file first.
Patch only inside your owned bounded context unless a shared validation service is explicitly required.
Preserve:
- tenant scoping
- lifecycle correctness
- null semantics
- collection semantics
- detail/mutation response consistency
In your final note, include:
- files changed
- contract changes
- lifecycle changes
- verification run
```

### Fast prompt: boundary reviewer

```text
Read docs/AGENT_ARCHITECTURAL_CONTRACT.md first.
Audit whether the proposed change crosses a bounded-context boundary incorrectly.
Focus on:
- ownership of the business rule
- policy placement
- repository coupling
- serializer contract drift
- collection semantics drift
Return findings only.
```

---

## Recommended Use in Practice

If you want to spawn several agents, the cleanest order is:

1. one explorer agent per bounded context involved
2. one worker agent per disjoint write scope
3. optionally one reviewer agent on the boundary files only

Example:

- Sales + Dispatch task
  - explorer-sales
  - explorer-dispatch
  - worker-sales-state
  - worker-dispatch-lifecycle
  - reviewer-boundary

- Pricing + Products task
  - explorer-products
  - explorer-pricing
  - worker-catalog
  - worker-pricing

---

## Final Rule

If an agent starts by reading random entities or controllers without first
mapping ownership, module entry points and use-case flow, it is booting
incorrectly.

The correct order is:

1. architecture contract
2. module entry point
3. runtime path
4. shared validation
5. patch
