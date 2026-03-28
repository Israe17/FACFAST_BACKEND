# Frontend Form Operational Contract

## Purpose

This document defines the operational contract for editable forms in frontend.

It is not tied to one screen only. It is the shared rule set for forms that
create, edit, reopen, and submit backend resources in this system.

It covers:

- response schemas used by forms
- form state structure
- select handling
- payload builders
- catalog loading strategy
- dialog hydration
- create/edit/reopen lifecycle

Related references:

- [AGENT_ARCHITECTURAL_CONTRACT.md](./AGENT_ARCHITECTURAL_CONTRACT.md)
- [FRONTEND_BACKEND_EDITABLE_RESOURCE_CONTRACT.md](./FRONTEND_BACKEND_EDITABLE_RESOURCE_CONTRACT.md)

---

## Core Principle

Forms should be built around a normalized draft state, not around raw backend
payloads.

The backend detail response is the source of truth for hydration, but frontend
must normalize it into predictable form state before editing.

Rule:

- backend response shape is input to form normalization
- frontend draft shape is input to payload builders
- payload builders are the only thing that should know how to translate form
  state back into backend payloads

---

## Standard Form Architecture

Every serious editable form should be modeled as four layers.

### 1. Server resource state

Raw data from:

- detail `GET`
- create `POST`
- update `PATCH`

This state should be preserved for:

- comparison
- reset
- dirty detection baseline
- reopen hydration

### 2. Normalized form draft

Frontend-owned, editable state.

This is what the UI binds to.

### 3. Catalog state

Separate store for:

- selects
- lookups
- option lists
- async search data

Catalog state must not be mixed into form draft.

### 4. UI/session state

Temporary view state:

- active tab
- dialog open/close state
- accordion state
- search term
- inline lookup state
- loading and submission flags

UI state must not be sent in payload builders.

---

## Standard Form State Shape

Recommended frontend shape:

```ts
type EditableResourceFormState<TDraft, TDetail, TCatalogs> = {
  mode: 'create' | 'edit';
  resourceId: number | null;
  detail: TDetail | null;
  draft: TDraft;
  catalogs: TCatalogs;
  status: {
    isHydrating: boolean;
    isSubmitting: boolean;
    isDirty: boolean;
    isReopening: boolean;
  };
  ui: {
    activeTab?: string;
    openDialogs: Record<string, boolean>;
    search: Record<string, string>;
  };
};
```

### Rule

- `detail` is the last authoritative backend snapshot
- `draft` is the editable normalized version
- `catalogs` are external supporting inputs
- `ui` is not domain state

---

## Response Schemas Used By Forms

### List response

List responses are not enough to hydrate an edit form.

Use list responses for:

- tables
- picker dialogs
- summary cards
- fast badges

Do not use list rows as edit hydration source unless the screen is truly
read-only.

### Detail response

Detail `GET` is the main edit hydration source.

A frontend form should expect detail responses to include:

- scalar ids
- minimal related labels
- child collections if the form owns them
- lifecycle
- timestamps

### Mutation response

`POST` and `PATCH` should be treated as detail-grade responses.

Frontend should prefer:

- replacing `detail`
- re-normalizing `draft`
- keeping current UI state if safe

instead of manually patching local draft after submission.

---

## Select Handling Contract

### Rule 1. Draft stores scalar ids

For standard relations, form draft should store:

- `branch_id`
- `customer_contact_id`
- `warehouse_id`
- `product_variant_id`

not the full object.

### Rule 2. Detail provides label fallback

Before catalogs finish loading, the form should be able to render current
selection labels from the detail payload.

Pattern:

```ts
draft.branch_id = detail.branch_id;
selectedBranchLabel = detail.branch?.name ?? null;
```

### Rule 3. Select UI should merge two sources

Selects should work with:

- current selected relation from detail
- catalog options loaded later

The current selection must remain renderable even if the catalog request is
still pending.

### Rule 4. Do not store whole option objects in draft

Store only scalar ids in draft.

If the UI needs full option objects, derive them from:

- detail relation
- loaded catalog
- search result cache

---

## Catalog Loading Strategy

Frontend should classify catalogs into three groups.

### A. Required-at-open catalogs

Needed before the form can be meaningfully used.

Examples:

- sale mode enum source
- fulfillment mode enum source
- small branch lists
- warehouse list for warehouse-required forms

### B. Lazy catalogs

Needed only after user interaction.

Examples:

- contact lookup dialogs
- product pickers
- variant selectors
- user pickers for assignees/drivers

### C. Optional supporting catalogs

Useful but not required for initial render because detail payload already gives
current label.

Examples:

- current branch label already present in detail
- current price list label already present in detail
- current zone label already present in detail

### Rule

Forms should not block initial rendering waiting for every catalog if detail
already provides enough label information to paint current values.

---

## Payload Builder Contract

Every editable form should have a dedicated payload builder layer.

Recommended functions:

```ts
buildCreatePayload(draft, detail?) => backendCreatePayload
buildUpdatePayload(draft, detail) => backendUpdatePayload
normalizeDetailToDraft(detail) => draft
```

### Responsibilities of payload builders

- map frontend draft to backend DTO shape
- apply `undefined` vs `null` rules
- map child collections
- strip UI-only fields
- normalize empty strings
- preserve backend collection semantics

### Rule

Components should not craft payloads inline.

All non-trivial forms should use centralized payload builders.

---

## `null` vs `undefined` in Frontend Form State

Frontend must treat these separately.

### `undefined`

Means:

- leave unchanged on update
- do not send field

### `null`

Means:

- intentionally clear field
- send explicit `null` when backend contract supports it

### Empty string

Frontend should not assume empty string is equivalent to `null`.

Payload builder decides whether:

- `''` becomes omitted
- `''` becomes `null`
- `''` stays as string

based on backend contract for that field.

---

## Replace-All vs Subresource Collections in Forms

### Replace-all collections

Examples:

- sale order lines
- sale order delivery charges
- promotion items

Frontend rule:

- the form owns the full collection
- payload builder sends the complete current set when included
- omission preserves backend state
- if backend allows empty array clearing, send `[]` explicitly

### Subresource-managed collections

Examples:

- user roles
- user branch access
- role permissions
- dispatch stops
- dispatch expenses

Frontend rule:

- base resource form should not pretend to own these collections if the backend
  treats them as separate subresources
- these should use dedicated dialogs, tabs, or flows
- each subresource flow should follow its own payload contract

---

## Dialog Hydration Contract

### Create dialog

Hydration source:

- frontend defaults
- route context
- minimal required catalogs

### Edit dialog

Hydration source:

- detail `GET`
- then `normalizeDetailToDraft(detail)`
- then lazy/secondary catalogs

### Reopen dialog

Preferred order:

1. use last successful mutation response if it is still current enough
2. otherwise refetch detail
3. normalize again

### Rule

Reopening a dialog must never depend on list-row data alone if the resource has
relations or editable child collections.

---

## Create/Edit/Reopen Lifecycle

## Create lifecycle

1. initialize empty draft with domain defaults
2. load required-at-open catalogs
3. allow user input
4. build create payload
5. submit `POST`
6. replace `detail` with response
7. normalize returned detail if the form stays open

## Edit lifecycle

1. fetch detail `GET`
2. normalize detail to draft
3. load lazy catalogs as needed
4. build update payload from draft and baseline detail
5. submit `PATCH`
6. replace `detail` with response
7. re-normalize draft from response

## Reopen lifecycle

1. reopen using cached detail if safe
2. otherwise refetch detail
3. normalize to draft again
4. preserve only UI/session state that is safe to keep

---

## Dirty State Contract

Dirty detection should compare:

- normalized current draft
- normalized baseline derived from last detail snapshot

Do not compare raw backend payload objects to form draft directly.

This is especially important when:

- detail includes nested label objects
- draft stores only scalar ids
- payload builder transforms `''` into `null` or omission

---

## Frontend Checklist For Any Editable Form

Before implementing a form, answer:

1. What is the detail `GET` endpoint?
2. Does detail `GET` include current selection labels?
3. Does `POST/PATCH` return detail-grade payloads?
4. Is each child collection replace-all or subresource-managed?
5. Which fields accept explicit `null`?
6. Which catalogs are required before first paint?
7. Which catalogs can be loaded lazily?
8. Can the form reopen from mutation response, or must it refetch?

If these answers are not clear, the frontend contract is incomplete.

---

## Final Rule

A robust form should be able to:

- paint current values from detail
- edit using normalized draft state
- submit through a payload builder
- rehydrate from mutation response
- reopen without guessing relation labels

If one of those steps requires ad hoc fixes per screen, the contract is still
too weak.
