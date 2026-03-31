# Editable Resource Design Pattern — Backend

## Purpose

This is the single source of truth for how the backend must expose any resource
that the frontend will create, edit, or reopen in a form.

It replaces and consolidates the backend-side rules from:

- `FRONTEND_BACKEND_EDITABLE_RESOURCE_CONTRACT.md`
- `FRONTEND_FORM_OPERATIONAL_CONTRACT.md`
- `AGENT_ARCHITECTURAL_CONTRACT.md` (response contract section)

Those documents remain valid as reference, but this document is the
**implementable pattern** that every module must follow.

---

## The Problem This Solves

When a user opens an edit form, the frontend needs two things:

1. The current values of the entity (to populate the form)
2. Labels for related entities (to display in selects)

If the backend returns only scalar FK IDs (`branch_id: 4`) without the related
label (`branch: {id: 4, name: "Sucursal Central"}`), the frontend is forced to
load complete catalogs before it can show the current selection.

This causes the "empty form flash" where selects appear blank for 100-500ms
while catalog queries resolve.

The backend must provide enough information so the frontend can paint the
current state of the form **immediately**, without waiting for any catalog.

---

## Pattern: Detail Response Contract

Every detail `GET` endpoint for an editable resource must return:

### 1. Scalar FK IDs (for form binding)

```json
{
  "branch_id": 4,
  "customer_contact_id": 12,
  "warehouse_id": 7
}
```

### 2. Minimal label objects (for immediate display)

```json
{
  "branch": { "id": 4, "code": "BR-004", "name": "Sucursal Central" },
  "customer_contact": { "id": 12, "name": "Cliente Demo S.A." },
  "warehouse": { "id": 7, "name": "Bodega Principal" }
}
```

### 3. Both together (the complete pattern)

```json
{
  "branch_id": 4,
  "branch": { "id": 4, "code": "BR-004", "name": "Sucursal Central" },
  "customer_contact_id": 12,
  "customer_contact": { "id": 12, "name": "Cliente Demo S.A." },
  "warehouse_id": 7,
  "warehouse": { "id": 7, "name": "Bodega Principal" }
}
```

### Why both are required

- **Scalar ID**: the frontend stores this in the form draft and sends it back
  in the update payload
- **Label object**: the frontend uses this to render the current selection in
  the select trigger without needing the full catalog

---

## Minimal Label Object Specification

The nested label object must include at minimum:

```typescript
{
  id: number;
  name: string;
}
```

Optional extras when useful for display:

- `code` — when entities have human-readable codes
- `sku` — for product variants
- `variant_name` — for product variants
- `branch_number` — for branches
- `business_name` — for branches
- `plate_number` — for vehicles

### Rule

Include only what the frontend needs to paint the current selection label.
Do not embed the full related entity.

---

## Pattern: Mutation Response Contract

`POST` and `PATCH` responses **must return the same shape as detail `GET`**.

This means:

1. Save the entity
2. Reload through the repository with the same relations used by detail `GET`
3. Serialize the reloaded entity

```typescript
// In use-case:
async execute(id: string, dto: UpdateDto): Promise<EntityView> {
  // 1. Load, validate, persist
  await this.repository.save(entity);

  // 2. Reload with detail relations
  const reloaded = await this.repository.find_by_id_in_business(
    id,
    business_id,
    ENTITY_DETAIL_RELATIONS,  // Same relations as GET detail
  );

  // 3. Serialize
  return this.serializer.serialize(reloaded);
}
```

### Why this matters

The frontend can use the mutation response to update its local cache
immediately, without needing to refetch the detail endpoint.

---

## Pattern: Repository Relation Constants

Every repository that serves an editable resource must define:

```typescript
const ENTITY_LIST_RELATIONS = [
  'relation_a',
  'relation_b',
];

const ENTITY_DETAIL_RELATIONS = [
  ...ENTITY_LIST_RELATIONS,
  'child_collection',
  'child_collection.nested_relation',
];
```

### Current compliant examples

```
sale-orders.repository.ts    → SALE_ORDER_LIST_RELATIONS, SALE_ORDER_DETAIL_RELATIONS
dispatch-orders.repository.ts → DISPATCH_ORDER_LIST_RELATIONS, DISPATCH_ORDER_DETAIL_RELATIONS
products.repository.ts        → product_relations (object form)
```

### Rule

- List endpoints use `LIST_RELATIONS`
- Detail and mutation endpoints use `DETAIL_RELATIONS`
- Mutation endpoints reload with `DETAIL_RELATIONS` before serializing

---

## Pattern: Serializer Structure

Every serializer for an editable resource must follow:

```typescript
@Injectable()
export class EntitySerializer {
  serialize(entity: Entity): EntityView {
    return {
      id: entity.id,

      // Scalar FK IDs
      branch_id: entity.branch_id,

      // Minimal label objects (conditional on relation being loaded)
      branch: entity.branch
        ? { id: entity.branch.id, code: entity.branch.code, name: entity.branch.name }
        : undefined,

      // Scalar fields
      status: entity.status,
      notes: entity.notes,

      // Owned child collections
      lines: (entity.lines ?? []).map(line => this.serializeLine(line)),

      // Lifecycle
      lifecycle: {
        can_edit: entity.status === Status.DRAFT,
        can_delete: entity.status === Status.DRAFT,
        reasons: [],
      },

      // Timestamps
      created_at: entity.created_at,
      updated_at: entity.updated_at,
    };
  }
}
```

### Rules

1. Always return both `field_id` and `field` for every FK
2. Nested label object is conditional on relation being loaded (`entity.branch ?`)
3. Never return `undefined` for the scalar ID if the column is NOT NULL
4. For nullable FKs, return `null` explicitly (not `undefined`)

---

## Pattern: Lifecycle Block

Every editable resource response must include a `lifecycle` object:

```typescript
lifecycle: {
  can_edit: boolean;
  can_delete: boolean;
  // Entity-specific capabilities
  can_confirm?: boolean;
  can_cancel?: boolean;
  can_dispatch?: boolean;
  reasons: string[];
}
```

### Rules

- Flags must be computed from actual persisted state
- Never expose optimistic flags that the mutation endpoint will reject
- `reasons` should explain why an action is blocked (for UI messaging)

---

## Pattern: Collection Semantics

### Replace-all collections

The parent form owns the complete list. The update DTO accepts the full array.

Current examples:

- `sale_order.lines`
- `sale_order.delivery_charges`
- `promotion.items`

**Backend rule**: if the field is present in the update payload, replace the
entire collection. If absent, preserve the current collection.

### Subresource-managed collections

Managed through dedicated endpoints. The parent detail may include the
collection for display, but the parent update DTO does not accept it.

Current examples:

- `dispatch_order.stops` — item-level operations
- `dispatch_order.expenses` — item-level operations
- `user.roles` — full-set replacement via dedicated endpoint
- `user.branches` — full-set replacement via dedicated endpoint
- `role.permissions` — full-set replacement via dedicated endpoint

---

## `null` vs `undefined` Contract

For update DTOs:

| Value | Meaning |
|-------|---------|
| Field absent / `undefined` | Leave current value unchanged |
| Explicit `null` | Clear the field (set to NULL in DB) |
| Value present | Update to new value |

### Rule

Every nullable FK in an update DTO must accept `null` as a valid clearing
value. The frontend depends on this to implement "Sin vendedor" / "Sin zona"
type clearing.

---

## Compliance Matrix

Every editable resource must satisfy ALL of these:

| # | Requirement | Check |
|---|------------|-------|
| 1 | Detail GET returns scalar IDs for all editable FKs | |
| 2 | Detail GET returns minimal label objects for all FKs | |
| 3 | Detail GET includes owned child collections | |
| 4 | Detail GET includes lifecycle block | |
| 5 | POST returns detail-grade response | |
| 6 | PATCH returns detail-grade response | |
| 7 | Mutation reloads with DETAIL_RELATIONS before serializing | |
| 8 | `null` vs omission behavior is explicit in DTO | |
| 9 | Collection semantics (replace-all vs subresource) are explicit | |
| 10 | Serializer handles absent relations gracefully | |

### Current compliance status

| Resource | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 |
|----------|---|---|---|---|---|---|---|---|---|---|
| SaleOrder | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| DispatchOrder | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |
| Product | Y | Y | Y | Y | Y | Y | Y | Y | - | Y |
| Contact | Y | - | - | Y | Y | Y | Y | Y | - | Y |
| Branch | Y | - | Y | Y | Y | Y | Y | Y | - | Y |
| Warehouse | Y | Y | - | Y | Y | Y | Y | Y | - | Y |
| Role | Y | - | Y | Y | Y | Y | Y | Y | Y | Y |
| PriceList | Y | - | - | Y | Y | Y | Y | Y | - | Y |
| Promotion | Y | Y | Y | Y | Y | Y | Y | Y | Y | Y |

Note: Contact and Branch have no FK relations, so column 2 is N/A.

---

## Adding a New Editable Resource

When creating a new editable resource, follow this sequence:

### 1. Entity

Define the TypeORM entity with proper relations.

### 2. View contract

Create `contracts/entity.view.ts` with the response shape. Include:
- All scalar fields
- Scalar FK IDs
- Minimal label type for each FK
- Owned child collection types
- Lifecycle type

### 3. Serializer

Create `serializers/entity.serializer.ts`. Follow the pattern above.

### 4. Repository

Create with `LIST_RELATIONS` and `DETAIL_RELATIONS` constants.

### 5. Use cases

- Read use case: load with `DETAIL_RELATIONS`, serialize
- Create use case: persist, reload with `DETAIL_RELATIONS`, serialize
- Update use case: persist, reload with `DETAIL_RELATIONS`, serialize

### 6. Controller

Expose endpoints. Never shape responses in the controller.

### 7. DTO

Define create/update DTOs. Document `null` behavior for nullable fields.

---

## Reference: Current File Locations

| Resource | Entity | View | Serializer | Repository |
|----------|--------|------|------------|------------|
| SaleOrder | `sales/entities/sale-order.entity.ts` | `sales/contracts/sale-order.view.ts` | `sales/serializers/sale-order.serializer.ts` | `sales/repositories/sale-orders.repository.ts` |
| DispatchOrder | `inventory/entities/dispatch-order.entity.ts` | `inventory/contracts/dispatch-order.view.ts` | `inventory/serializers/dispatch-order.serializer.ts` | `inventory/repositories/dispatch-orders.repository.ts` |
| Product | `inventory/entities/product.entity.ts` | `inventory/contracts/product.view.ts` | `inventory/serializers/product.serializer.ts` | `inventory/repositories/products.repository.ts` |
| Contact | `contacts/entities/contact.entity.ts` | `contacts/contracts/contact.view.ts` | `contacts/serializers/contact.serializer.ts` | `contacts/repositories/contacts.repository.ts` |
| Branch | `branches/entities/branch.entity.ts` | `branches/contracts/branch.view.ts` | `branches/serializers/branch.serializer.ts` | `branches/repositories/branches.repository.ts` |
| Warehouse | `inventory/entities/warehouse.entity.ts` | `inventory/contracts/warehouse.view.ts` | `inventory/serializers/warehouse.serializer.ts` | `inventory/repositories/warehouses.repository.ts` |
| Role | `rbac/entities/role.entity.ts` | `rbac/contracts/role.view.ts` | `rbac/serializers/role.serializer.ts` | `rbac/repositories/roles.repository.ts` |

All paths are relative to `src/modules/`.
