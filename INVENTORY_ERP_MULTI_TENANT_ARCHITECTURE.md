# Inventory ERP Multi-Tenant Architecture

## Non-Negotiable Rule

Everything inventory-related must be tenant-safe, company-scoped, and
internally flexible across branches and warehouses, but never cross-company.

In this project:

- company = tenant = `business_id`
- branch = operational/commercial unit
- warehouse = logistic stock location

## A. Arquitectura objetivo refinada

### 1. Principios obligatorios

These principles remain fixed:

- every inventory table must be company-scoped by `business_id`
- ownership always belongs to the company
- visibility and usage may vary by branch or warehouse
- nothing inventory-related may cross companies
- never assume `1 branch = 1 warehouse`
- never duplicate products by branch
- separate:
  - master product vs stockable SKU
  - current stock vs historical movements
  - ownership vs visibility
  - inventory vs pricing

### 2. Modelo conceptual objetivo

Inside one company:

1. there is one commercial product master
2. there may be one or more stockable SKUs
3. each SKU may exist in one or more warehouses
4. stock is controlled per warehouse, optional location, and optional lot
5. branches operate commercially over one or more warehouses
6. prices are resolved by pricing scope, not by stock structure

### 3. Producto maestro y capa stockeable

Target architecture:

- `products` = commercial master per company
- `product_variants` = stockable / sellable SKU layer

Why this is the healthiest target:

- product master keeps stable commercial identity
- variant is the unit that really:
  - carries `sku`
  - carries `barcode`
  - carries stock
  - carries price
  - carries lot traceability if enabled
  - participates in purchases, sales and stock movements

If a product has no real variants:

- create one default variant

This lets the ERP grow into:

- sizes
- colors
- presentations
- packaging
- commercial configurations

without redesigning stock, pricing or movements.

### 4. Warehouses as logistic units

Warehouse must not be modeled as a synonym of branch.

Recommended target:

- `warehouses`
  - owned by company
  - can be shared by several branches
  - can be exclusive to one branch
  - can represent saleable, reserve, damaged, returns, transit, production or
    general storage roles
- `warehouse_branch_links`
  - determines where a warehouse is operationally usable

This solves all four required scenarios:

- one warehouse shared by all branches
- one warehouse shared by some branches only
- one warehouse per branch
- several warehouses used by one branch

### 5. Stock architecture

Do not store stock on `products` or `product_variants`.

Target split:

- `inventory_balances`
  - fast current state
- `inventory_movement_headers`
  - movement document
- `inventory_movement_lines`
  - immutable ledger lines

Optional advanced layers:

- `warehouse_locations`
- `inventory_lots`
- `inventory_reservations`
- `inventory_cost_layers`

### 6. Current stock vs historical ledger

Recommended responsibility split:

- `inventory_balances`
  - current quantitative state only
  - no operational policy fields
- `inventory_movement_lines`
  - immutable historical trace
  - one line per stock impact

This is the clean split for ERP reporting:

- stock by warehouse
- consolidated stock
- kardex by SKU
- traceability by source document
- valuation extensions later

### 7. Ownership vs visibility

Ownership:

- always the company via `business_id`

Visibility / usage:

- controlled by assignments and bridge tables

Examples:

- warehouse usable by branch:
  - `warehouse_branch_links`
- price list usable by company, branch or warehouse:
  - `price_list_assignments`
- optional product commercial visibility by branch:
  - `product_branch_visibility`

Do not push `branch_id` into product masters or catalog masters just to solve
visibility. That mixes concerns and makes the model rigid.

### 8. Scope recomendado por catalogo

Company-scoped only:

- `brands`
- `product_categories`
- `unit_measures`
- `fiscal_profiles`
- `warranty_profiles`
- `products`
- `product_variants`

Company-owned with internal operational flexibility:

- `warehouses`
- `warehouse_branch_links`
- `warehouse_locations`
- `warehouse_product_settings`

Flexible commercial scope:

- `price_lists`
- `price_list_items`
- `price_list_assignments`

### 9. Pricing architecture

Do not use a loose `scope_type + scope_id` with no referential integrity.

Target recommendation:

- `price_lists`
- `price_list_items`
- `price_list_assignments`

`price_list_assignments` should keep explicit nullable FKs:

- `business_id`
- `price_list_id`
- `scope_level`
- `branch_id` nullable
- `warehouse_id` nullable
- `customer_segment_id` nullable
- `priority`
- `effective_from`
- `effective_to`
- `is_active`

Target resolution rule for effective price list:

1. filter by `business_id`
2. filter by active assignment and effective date range
3. resolve by scope precedence:
   - `warehouse`
   - `branch`
   - `company`
4. within same scope level, smaller `priority` wins
5. ties should be prevented by constraints, not by business guesswork

Customer segment should remain part of the target architecture, but not part of
the first pricing release unless the commercial roadmap really needs it.

### 10. Lots, reservations and transit

These are part of the target architecture, but they are not mandatory in the
core release:

- `inventory_lots`
  - for expiration, manufacturing date, lot traceability, supplier-lot control
- `inventory_reservations`
  - for serious order allocation, picking and release workflows
- transit-aware transfers
  - for non-instant warehouse-to-warehouse logistics

## B. Arquitectura MVP recomendada

### MVP goal

Build the smallest correct core that:

- is tenant-safe
- respects company ownership everywhere
- does not paint us into a corner
- is ready for purchases, sales and pricing integration

### Fase 1 - nucleo obligatorio

Entities to build first:

- `warehouses`
- `warehouse_branch_links`
- `brands`
- `product_categories`
- `unit_measures`
- `fiscal_profiles`
- `warranty_profiles`
- `products`
- `product_variants`
- `inventory_balances`
- `inventory_movement_headers`
- `inventory_movement_lines`

Recommended MVP behavior:

- company-scoped catalog masters
- flexible branch-to-warehouse operation
- product master plus stockable variant layer
- current stock by warehouse and variant
- movement ledger ready for:
  - purchase receipt
  - sales dispatch
  - stock adjustment
  - transfer
  - manual correction

### Fase 2 - comercial / pricing

Designed now, implemented next:

- `price_lists`
- `price_list_items`
- `price_list_assignments`

Phase 2 should support:

- company-level price list
- branch-level price list
- warehouse-level price list
- effective date ranges
- deterministic priority resolution

### Fase 3 - logistica avanzada y extensiones

Future extensions:

- `warehouse_locations`
- `warehouse_product_settings`
- `inventory_lots`
- `inventory_reservations`
- `inventory_reservation_lines`
- `product_branch_visibility`
- `inventory_cost_layers`
- transfer in transit workflow

### Why this phase split is healthy

It gives us:

- a correct multi-tenant core now
- pricing without redesign later
- advanced logistics without blocking the first rollout

## C. Decisiones criticas

### 1. Variants in MVP: yes or no

Recommendation:

- yes, implement `product_variants` from MVP

Reasoning:

- this ERP clearly has future pressure toward:
  - presentations
  - sellable units
  - warehouse stock per sellable SKU
  - pricing by SKU
  - lot traceability by stockable item
- migrating later from `products` as stockable unit to `product_variants`
  touches:
  - balances
  - movements
  - pricing
  - lots
  - purchases
  - sales

That migration is expensive and risky.

Pragmatic MVP compromise:

- create one default variant automatically for each product
- frontend may hide variant management initially
- backend still keeps the stockable layer correct from day one

Fallback only if the team absolutely cannot absorb it now:

- temporarily use `products` as stockable unit
- but this is not the recommended path

### 2. Lots in MVP: yes or no

Recommendation:

- no, not in MVP

Reasoning:

- lot logic is valuable but not always needed on day one
- it adds complexity in:
  - receiving
  - dispatch
  - transfers
  - UI selectors
  - validations

Target stance:

- keep the architecture prepared for lots
- do not make lots mandatory for the first release

### 3. Reservations in MVP: yes or no

Recommendation:

- no documentary reservation subsystem in MVP

Reasoning:

- reservations are important when there are:
  - pending orders
  - picking waves
  - separated stock commitment workflows
- they are not required to start a serious inventory core

MVP stance:

- keep `reserved_quantity` in `inventory_balances`
- allow reservation-related deltas in movement lines
- defer `inventory_reservations` and `inventory_reservation_lines` until the
  sales flow really needs document-level reservation control

### 4. Transfer model: immediate vs in transit

Recommendation:

- MVP: immediate transfer
- target extension: transfer with transit

#### MVP transfer

Model:

- one header
- two movement lines posted atomically
  - origin warehouse out
  - destination warehouse in

Why this should be MVP:

- simpler
- operationally sufficient for many businesses
- already compatible with ledger design

#### Future transfer with transit

Model:

- header starts in `in_transit`
- origin out is posted first
- destination in is posted on receipt

How to prepare for it now:

- keep `status` on movement header
- keep `source_document_type` and linked line references
- do not hardcode the assumption that both lines must always post together

### 5. Pricing scopes and priorities

Recommendation:

- phase 2 should support `company`, `branch`, `warehouse`
- `customer_segment` stays in target design but can wait if no immediate use

Recommended precedence:

1. warehouse
2. branch
3. company

Recommended fallback:

- if no warehouse assignment applies, try branch
- if no branch assignment applies, try company
- if none exists, use product base price strategy or fail fast by business rule,
  depending on sales policy

Recommended tie policy:

- smaller numeric `priority` wins
- do not rely on arbitrary fallback when equal priority exists
- prevent equal active priority for the same scope tuple with DB constraints or
  service validation

### 6. Warehouse purpose modeling

Recommendation for MVP:

- use a simple controlled enum/string field on `warehouses`
  - `warehouse_type` or `purpose`

Suggested values:

- `saleable`
- `reserve`
- `damaged`
- `returns`
- `transit`
- `production`
- `general_storage`

Do not introduce a separate `warehouse_purposes` table in MVP unless one of
these becomes true:

- a warehouse may have multiple purposes at the same time
- companies may configure custom purpose catalogs
- rules become complex enough to justify a separate policy layer

### 7. Product branch visibility

Recommendation:

- keep `product_branch_visibility` as optional phase 3 extension

Reasoning:

In many businesses, branch-level product availability can already be resolved by:

- warehouses assigned to that branch
- stock existing in those warehouses
- price lists
- commercial rules

Do not make product-branch visibility part of the core unless a real business
case proves that branch-level commercial hiding is required independently of
warehouse stock and pricing.

## D. Entidades por fase

### Fase 1 - nucleo obligatorio

- `warehouses`
  - company-owned warehouse master
- `warehouse_branch_links`
  - branch-to-warehouse operational usage bridge
- `brands`
  - company-scoped product brand catalog
- `product_categories`
  - company-scoped category tree
- `unit_measures`
  - company-scoped measurement unit catalog
- `fiscal_profiles`
  - company-scoped fiscal profile catalog
- `warranty_profiles`
  - company-scoped warranty profile catalog
- `products`
  - commercial product master
- `product_variants`
  - stockable / sellable SKU layer
- `inventory_balances`
  - current stock state by company + warehouse + variant
- `inventory_movement_headers`
  - movement document header
- `inventory_movement_lines`
  - immutable stock ledger lines

### Fase 2 - comercial / pricing

- `price_lists`
  - company-owned price list header
- `price_list_items`
  - price entries per variant
- `price_list_assignments`
  - scope assignments with explicit FKs and priority

### Fase 3 - logistica avanzada

- `warehouse_locations`
  - internal warehouse structure
- `warehouse_product_settings`
  - operational policy per warehouse + variant
- `inventory_lots`
  - lot traceability
- `inventory_reservations`
  - reservation header
- `inventory_reservation_lines`
  - reservation detail
- `product_branch_visibility`
  - optional commercial visibility layer
- `inventory_cost_layers`
  - advanced valuation strategy support

## E. Constraints e indices recomendados

### 1. Business ownership rule

Every inventory-related table keeps `business_id NOT NULL`.

Do not remove it from child tables just because it can be inferred through a
join.

Reasons:

- tenant safety
- clearer queries
- simpler filters
- simpler consistency checks
- less dependence on joins to enforce company isolation

### 2. Recommended integrity strategy

Use a two-layer integrity strategy:

#### Database-level integrity

1. primary key on `id`
2. explicit `business_id NOT NULL`
3. extra `UNIQUE (id, business_id)` on company-owned parent tables
4. composite foreign keys from child tables to `(id, business_id)` pairs

This allows DB-level tenant consistency such as:

- `product_variants (product_id, business_id) -> products (id, business_id)`
- `warehouse_branch_links (warehouse_id, business_id) -> warehouses (id, business_id)`
- `warehouse_branch_links (branch_id, business_id) -> branches (id, business_id)`
- `inventory_balances (warehouse_id, business_id) -> warehouses (id, business_id)`
- `inventory_balances (product_variant_id, business_id) -> product_variants (id, business_id)`
- `inventory_movement_lines (header_id, business_id) -> inventory_movement_headers (id, business_id)`
- `inventory_movement_lines (warehouse_id, business_id) -> warehouses (id, business_id)`
- `inventory_movement_lines (product_variant_id, business_id) -> product_variants (id, business_id)`

#### Service-level integrity

Keep service validation for semantic rules that DB constraints do not fully
cover cleanly:

- branch is allowed to operate that warehouse
- warehouse location belongs to selected warehouse
- destination warehouse is valid for transfer
- fiscal profile item kind matches variant type
- lot belongs to the same warehouse and variant
- price list assignment precedence and overlap policy

### 3. Recommended uniqueness constraints

At minimum:

- `brands`: unique `(business_id, code)`, unique normalized `(business_id, name)`
- `product_categories`: unique `(business_id, code)`, unique normalized
  `(business_id, parent_id, name)`
- `unit_measures`: unique `(business_id, code)`, unique normalized
  `(business_id, name)`, unique normalized `(business_id, symbol)`
- `fiscal_profiles`: unique `(business_id, code)`, unique normalized
  `(business_id, name)`
- `warranty_profiles`: unique `(business_id, code)`, unique normalized
  `(business_id, name)`
- `warehouses`: unique `(business_id, code)`
- `warehouse_branch_links`: unique `(business_id, warehouse_id, branch_id)`
- `products`: unique `(business_id, code)`
- `product_variants`: unique `(business_id, code)` if code exists,
  unique `(business_id, sku)`, unique nullable `(business_id, barcode)` when
  barcode exists
- `inventory_balances`: unique
  `(business_id, warehouse_id, warehouse_location_id, product_variant_id)`
  using a null-safe strategy for optional location
- `inventory_movement_headers`: unique `(business_id, code)` if using a
  business-visible movement code
- `inventory_movement_lines`: unique `(business_id, header_id, line_no)`
- `price_lists`: unique `(business_id, code)`, optionally unique normalized
  `(business_id, name)` depending on pricing policy
- `price_list_items`: unique `(business_id, price_list_id, product_variant_id)`

### 4. Recommended check constraints

- quantities in `inventory_balances`:
  - `on_hand_quantity >= 0`
  - `reserved_quantity >= 0`
  - `incoming_quantity >= 0`
  - `outgoing_quantity >= 0`
- operational values in `warehouse_product_settings`:
  - `minimum_stock >= 0`
  - `reorder_point >= 0`
  - `reorder_quantity >= 0`
- movement line values:
  - `quantity > 0`
- price list assignment scope rules:
  - if `scope_level = company`, all scope FK columns must be `NULL`
  - if `scope_level = branch`, `branch_id` required and the others `NULL`
  - if `scope_level = warehouse`, `warehouse_id` required and the others `NULL`
  - if `scope_level = customer_segment`, `customer_segment_id` required and
    the others `NULL`

### 5. Avoiding duplicate operational settings in balances

Do not duplicate `minimum_stock` or `reorder_point` inside balances.

Recommended split:

- `inventory_balances`
  - `on_hand_quantity`
  - `reserved_quantity`
  - `incoming_quantity`
  - `outgoing_quantity`
  - `updated_at`
- `warehouse_product_settings`
  - `minimum_stock`
  - `reorder_point`
  - `reorder_quantity`
  - `is_sellable_from_warehouse`
  - `is_active`

This keeps balances purely quantitative and settings purely operational.

### 6. Recommended indexes

For tenant safety and common reads:

- `brands (business_id, code)`
- `product_categories (business_id, parent_id)`
- `unit_measures (business_id, code)`
- `fiscal_profiles (business_id, code)`
- `warranty_profiles (business_id, code)`
- `warehouses (business_id, code)`
- `warehouse_branch_links (business_id, branch_id, warehouse_id)`
- `products (business_id, code)`
- `product_variants (business_id, sku)`
- `product_variants (business_id, barcode)`
- `inventory_balances (business_id, warehouse_id, product_variant_id)`
- `inventory_balances (business_id, product_variant_id)`
- `inventory_movement_headers (business_id, occurred_at)`
- `inventory_movement_headers (business_id, movement_type, occurred_at)`
- `inventory_movement_lines (business_id, product_variant_id, warehouse_id)`
- `inventory_movement_lines (business_id, header_id)`
- `price_lists (business_id, code)`
- `price_list_items (business_id, product_variant_id)`
- `price_list_assignments (business_id, scope_level, branch_id, warehouse_id)`
- `price_list_assignments (business_id, effective_from, effective_to)`

If lots are added later:

- `inventory_lots (business_id, warehouse_id, product_variant_id)`
- `inventory_lots (business_id, lot_number)`

### 7. Recommended overlap policy for price assignments

For the same effective scope tuple:

- do not allow overlapping active assignments with the same `priority`
- if overlap is allowed, precedence must still be deterministic

Recommended MVP-safe rule:

- one active assignment per exact scope tuple and priority at a time

If pricing becomes more temporal later, consider Postgres exclusion
constraints over date ranges.

## Final separation: Arquitectura objetivo vs Arquitectura MVP

### Arquitectura objetivo

The full target architecture is:

- `products` + `product_variants`
- `warehouses` + `warehouse_branch_links`
- `inventory_balances`
- `inventory_movement_headers` + `inventory_movement_lines`
- pricing assignments with scope precedence
- optional warehouse locations
- optional lots
- optional reservations
- optional cost layers

This is the ERP-safe, modular, extensible end state.

### Arquitectura MVP recomendada

Build first:

- company-owned catalog masters
- flexible warehouses linked to branches
- product master plus default stockable variant
- current stock balances
- movement header + line ledger
- immediate transfer model

Do not build yet unless the business already requires it:

- lots
- reservation documents
- warehouse internal locations
- branch-level product visibility
- customer-segment pricing
- transit transfer workflow

That gives a clean base without under-designing the ERP core.
