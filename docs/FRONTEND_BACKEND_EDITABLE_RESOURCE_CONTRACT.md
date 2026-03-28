# Frontend-Backend Editable Resource Contract

## Purpose

This document defines the bridge contract between frontend forms and backend
editable resources, especially when the resource has relations.

It focuses on:

- detail `GET`
- mutation `POST/PATCH`
- relation labels
- `null` vs `undefined`
- replace-all vs subresource collections
- frontend/backend id handling

It is the handshake contract between the backend resource model and the frontend
form model.

Related references:

- [AGENT_ARCHITECTURAL_CONTRACT.md](./AGENT_ARCHITECTURAL_CONTRACT.md)
- [FRONTEND_FORM_OPERATIONAL_CONTRACT.md](./FRONTEND_FORM_OPERATIONAL_CONTRACT.md)

---

## Core Principle

If a resource is editable in frontend, backend detail and mutation contracts
must support edit hydration directly.

The frontend should not need to guess:

- current labels
- current child collection ownership
- whether a field clears with `null`
- whether omission preserves the previous value

---

## Detail `GET` Contract

For editable resources, detail `GET` should return:

- scalar ids for editable relations
- minimal label objects for current related selections
- child collections if the form owns them
- lifecycle block
- timestamps

### Minimum relation pattern

Preferred shape:

```json
{
  "warehouse_id": 4,
  "warehouse": {
    "id": 4,
    "code": "WH-0004",
    "name": "Bodega Heredia"
  }
}
```

### Why this is required

It allows frontend to:

- hydrate the draft with scalar ids
- render current labels immediately
- avoid blocking the edit dialog on full catalog fetches

### Editable detail rule

If the resource is editable and contains relations, returning only the scalar FK
is not enough unless the UI is guaranteed to load the catalog before render.

The preferred contract is:

- scalar id
- minimal nested label object

---

## `POST` and `PATCH` Contract

### Rule

For editable resources, `POST` and `PATCH` should return the same contract grade
as detail `GET`.

That means mutation responses should include:

- scalar ids
- minimal nested label objects
- child collections if owned by the form
- lifecycle
- timestamps

### Why this matters

Without detail-grade mutation responses, frontend has to:

- patch local draft manually
- keep stale labels
- refetch immediately after submit

That makes forms fragile and inconsistent.

### Backend implementation implication

If serializer needs relations:

- save
- reload through repository with needed relations
- serialize the reloaded entity

Never serialize half-hydrated entities after mutation when the editable detail
contract expects related labels.

---

## Minimal Relation Contract For Labels

These nested objects are not full catalogs.

They are label helpers for the current selection only.

Recommended minimum:

```json
{
  "id": 8,
  "code": "CT-0008",
  "name": "Cliente Demo"
}
```

Optional extras when useful:

- `branch_number`
- `business_name`
- `variant_name`
- `sku`
- `lot_number`

### Rule

Detail responses should not embed huge related objects.

They should embed only enough to:

- paint the current selection
- reopen forms and dialogs
- build stable summary labels

---

## `null` vs `undefined` Contract

## Backend meaning

- omitted field => no change
- explicit `null` => clear field, if supported by DTO/contract

## Frontend meaning

- draft field absent or omitted => do not send on update
- draft field set to `null` => intentionally clear

### Required discipline

Frontend payload builders must know, per field:

- whether `null` is allowed
- whether omission preserves state
- whether empty string should become `null` or omission

### Example

If backend contract is:

```ts
code?: string | null
```

Then frontend update payload rules are:

- do not send `code` if unchanged
- send `code: null` to clear
- send `code: "WH-0001"` to update

---

## Replace-All vs Subresource Collections

## Replace-all collections

The collection belongs to the parent form.

Examples:

- sale order `lines`
- sale order `delivery_charges`
- promotion `items`

### Contract

- detail `GET` returns the full current collection
- `PATCH` may omit the field to preserve current collection
- `PATCH` replaces the full collection if the field is present
- backend should document whether `[]` is valid clearing or invalid

### Frontend rule

If the field is present in payload, it must represent the full desired final
state for that collection.

## Subresource-managed collections

The collection is edited through dedicated endpoints.

Examples:

- user roles
- user branches
- role permissions
- dispatch stops
- dispatch expenses

### Contract

- base resource detail may include the current collection for visibility
- base resource update should not pretend to own it unless backend says so
- dedicated subresource endpoints define their own replacement or item-level semantics

### Frontend rule

Use dedicated dialogs/tabs/workflows, not the base edit form payload, unless
the backend has explicitly promoted the collection into the base update DTO.

---

## Frontend/Backend ID Contract

### Draft storage rule

Frontend draft should store scalar ids:

- `branch_id`
- `warehouse_id`
- `customer_contact_id`
- `product_variant_id`

not the nested related object.

### Display rule

Frontend may display nested relation labels from:

- detail `GET`
- mutation response
- loaded catalog

### Backend rule

Backend should return both when the resource is editable:

- scalar id
- minimal nested label object

### Array relations

For child collections, the item payload should also keep scalar ids as the
authoritative editable values.

Example:

```json
{
  "product_variant_id": 12,
  "product_variant": {
    "id": 12,
    "sku": "SKU-00012",
    "variant_name": "Negro"
  }
}
```

---

## Contract Matrix By Resource Type

### Simple editable resource

Example:

- branch
- contact
- warehouse

Must return:

- scalar fields
- editable FK ids
- minimal nested relation labels
- lifecycle

### Editable resource with owned child collection

Example:

- sale order
- promotion

Must return:

- scalar fields
- editable FK ids
- nested current relation labels
- full owned child collection
- lifecycle

### Editable resource with subresource-managed collections

Example:

- user
- role

Should return:

- scalar fields
- base labels
- current assigned collections if useful for display
- but contract must still make clear that mutation happens through subresource endpoints

---

## Create/Edit/Reopen Handshake

## Create

Frontend needs:

- create defaults
- catalogs
- create DTO contract
- detail-grade `POST` response

## Edit

Frontend needs:

- detail `GET`
- normalized edit hydration
- `PATCH` contract
- detail-grade `PATCH` response

## Reopen

Frontend should be able to reopen from:

- cached detail
- or last successful mutation response

without waiting on full catalog round trips only to paint existing labels.

---

## Checklist For Backend When Exposing An Editable Resource

Before calling a backend resource "frontend-ready for edit", verify:

1. Does detail `GET` return scalar ids for editable relations?
2. Does detail `GET` return minimal label objects for current relations?
3. Does detail `GET` include owned child collections?
4. Does `POST/PATCH` return detail-grade payload?
5. Is `null` vs omission behavior explicit?
6. Is collection semantics explicit?
7. Does mutation reload before serialize when relations are needed?

If any answer is no, the editable contract is incomplete.

---

## Checklist For Frontend Before Implementing A Form

Before implementing or reopening a form, verify:

1. What is the detail endpoint?
2. Does detail include current labels?
3. What fields are scalar ids?
4. What fields accept `null`?
5. Which collections are replace-all?
6. Which collections are subresource-managed?
7. Is the mutation response detail-grade?

If not, escalate the contract gap instead of hardcoding assumptions into the
form.

---

## Final Rule

Editable frontend resources should feel deterministic.

That only happens when:

- backend detail contracts are edit-ready
- mutation responses are detail-grade
- ids and labels are both present where needed
- collection semantics are explicit
- `null` and omission are not ambiguous
