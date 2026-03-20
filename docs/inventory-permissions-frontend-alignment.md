# Inventory Permissions Frontend Alignment

## 1. Purpose

This document is the source of truth for the latest inventory permission
changes on the backend. It is written for the frontend team and for Codex
working on the frontend so the role management UI, route guards, action
buttons, and feature access stay aligned with the backend without guessing.

Scope:

- permission catalog exposed by backend
- new inventory permission keys
- endpoint -> permission mapping
- compatibility behavior for existing roles
- exact frontend rules for roles and feature gating

This document is focused on the latest permissions change only.

## 2. Backend source of truth

Main files:

- `src/modules/common/enums/permission-key.enum.ts`
- `src/modules/rbac/services/rbac-seed.service.ts`
- `src/modules/rbac/controllers/permissions.controller.ts`
- `src/modules/rbac/services/permissions.service.ts`
- `src/modules/rbac/utils/serialize-permission.util.ts`
- `src/modules/inventory/controllers/*.controller.ts`

Important backend facts:

1. Permissions are global catalog records.
2. The frontend must consume them from `GET /permissions`.
3. The backend returns each permission already normalized as:
   - `id`
   - `code`
   - `key`
   - `module`
   - `action`
   - `description`
4. The backend orders the permission catalog by `module ASC, action ASC`.
5. Inventory controllers now use more granular permissions instead of
   reusing generic `products.*` for variants, serials, and variant attributes.

## 3. Official endpoint for the frontend

### `GET /permissions`

Purpose:

- load the permission catalog shown in the roles screen
- map module/action labels
- drive role assignment UI

Security:

- requires `permissions.view`

Response shape:

```json
[
  {
    "id": 101,
    "code": "PM-0101",
    "key": "product_variants.view",
    "module": "product_variants",
    "action": "view",
    "description": "Can view product variants."
  }
]
```

Frontend rules:

- do not hardcode the inventory permission catalog
- use `key` as the stable identifier
- use `module` and `action` for grouping and rendering
- use `description` as helper text when useful
- preserve unknown future permissions instead of filtering them out

## 4. What changed in inventory permissions

Before this change:

- variant screens reused `products.view/create/update`
- serial screens reused `products.view/create/update`
- variant attribute actions reused `products.view/create/update`
- movement transfer and movement cancel reused
  `inventory_movements.adjust`
- many delete actions reused `*.update`

After this change:

- variants, serials, and variant attributes have their own permission modules
- movement transfer and movement cancel have their own action keys
- delete actions in inventory now have explicit `*.delete` permissions where
  a delete/deactivate endpoint exists

## 5. Inventory permission catalog

### Product categories

- `categories.view`
- `categories.create`
- `categories.update`
- `categories.delete`

### Brands

- `brands.view`
- `brands.create`
- `brands.update`
- `brands.delete`

### Measurement units

- `measurement_units.view`
- `measurement_units.create`
- `measurement_units.update`
- `measurement_units.delete`

### Tax profiles

- `tax_profiles.view`
- `tax_profiles.create`
- `tax_profiles.update`

Note:

- there is no tax profile delete endpoint today, so there is no
  `tax_profiles.delete`

### Products

- `products.view`
- `products.create`
- `products.update`
- `products.delete`

### Product variants

- `product_variants.view`
- `product_variants.create`
- `product_variants.update`
- `product_variants.delete`

### Variant attributes

- `variant_attributes.view`
- `variant_attributes.configure`
- `variant_attributes.generate`

### Price lists

- `price_lists.view`
- `price_lists.create`
- `price_lists.update`
- `price_lists.delete`

### Product prices

- `product_prices.view`
- `product_prices.create`
- `product_prices.update`
- `product_prices.delete`

### Warranty profiles

- `warranty_profiles.view`
- `warranty_profiles.create`
- `warranty_profiles.update`
- `warranty_profiles.delete`

### Promotions

- `promotions.view`
- `promotions.create`
- `promotions.update`
- `promotions.delete`

### Warehouses

- `warehouses.view`
- `warehouses.create`
- `warehouses.update`
- `warehouses.delete`

### Warehouse locations

- `warehouse_locations.view`
- `warehouse_locations.create`
- `warehouse_locations.update`

### Warehouse stock

- `warehouse_stock.view`

### Inventory lots

- `inventory_lots.view`
- `inventory_lots.create`
- `inventory_lots.update`
- `inventory_lots.delete`

### Inventory movements

- `inventory_movements.view`
- `inventory_movements.adjust`
- `inventory_movements.transfer`
- `inventory_movements.cancel`

### Product serials

- `product_serials.view`
- `product_serials.create`
- `product_serials.update`

## 6. Exact endpoint to permission mapping

### Categories

| Endpoint | Permission |
|---|---|
| `GET /categories` | `categories.view` |
| `GET /categories/tree` | `categories.view` |
| `GET /categories/:id` | `categories.view` |
| `POST /categories` | `categories.create` |
| `PATCH /categories/:id` | `categories.update` |
| `DELETE /categories/:id` | `categories.delete` |

### Brands

| Endpoint | Permission |
|---|---|
| `GET /brands` | `brands.view` |
| `GET /brands/:id` | `brands.view` |
| `POST /brands` | `brands.create` |
| `PATCH /brands/:id` | `brands.update` |
| `DELETE /brands/:id` | `brands.delete` |

### Measurement units

| Endpoint | Permission |
|---|---|
| `GET /measurement-units` | `measurement_units.view` |
| `GET /measurement-units/:id` | `measurement_units.view` |
| `POST /measurement-units` | `measurement_units.create` |
| `PATCH /measurement-units/:id` | `measurement_units.update` |
| `DELETE /measurement-units/:id` | `measurement_units.delete` |

### Tax profiles

| Endpoint | Permission |
|---|---|
| `GET /tax-profiles` | `tax_profiles.view` |
| `GET /tax-profiles/:id` | `tax_profiles.view` |
| `POST /tax-profiles` | `tax_profiles.create` |
| `PATCH /tax-profiles/:id` | `tax_profiles.update` |

### Products

| Endpoint | Permission |
|---|---|
| `GET /products` | `products.view` |
| `GET /products/:id` | `products.view` |
| `POST /products` | `products.create` |
| `PATCH /products/:id` | `products.update` |
| `DELETE /products/:id` | `products.delete` |

### Product variants

| Endpoint | Permission |
|---|---|
| `GET /products/:id/variants` | `product_variants.view` |
| `GET /products/:id/variants/:variantId` | `product_variants.view` |
| `POST /products/:id/variants` | `product_variants.create` |
| `PATCH /products/:id/variants/:variantId` | `product_variants.update` |
| `DELETE /products/:id/variants/:variantId` | `product_variants.delete` |
| `DELETE /products/:id/variants/:variantId/permanent` | `product_variants.delete` |

Important:

- the normal `DELETE` route for variant is still deactivate
- the `/permanent` route is hard delete
- both are protected by `product_variants.delete`

### Variant attributes

| Endpoint | Permission |
|---|---|
| `GET /products/:id/attributes` | `variant_attributes.view` |
| `PUT /products/:id/attributes` | `variant_attributes.configure` |
| `POST /products/:id/attributes/generate-variants` | `variant_attributes.generate` |

### Price lists

| Endpoint | Permission |
|---|---|
| `GET /price-lists` | `price_lists.view` |
| `GET /price-lists/:id` | `price_lists.view` |
| `POST /price-lists` | `price_lists.create` |
| `PATCH /price-lists/:id` | `price_lists.update` |
| `DELETE /price-lists/:id` | `price_lists.delete` |

### Product prices

| Endpoint | Permission |
|---|---|
| `GET /products/:id/prices` | `product_prices.view` |
| `POST /products/:id/prices` | `product_prices.create` |
| `PATCH /product-prices/:id` | `product_prices.update` |
| `DELETE /product-prices/:id` | `product_prices.delete` |

### Warranty profiles

| Endpoint | Permission |
|---|---|
| `GET /warranty-profiles` | `warranty_profiles.view` |
| `GET /warranty-profiles/:id` | `warranty_profiles.view` |
| `POST /warranty-profiles` | `warranty_profiles.create` |
| `PATCH /warranty-profiles/:id` | `warranty_profiles.update` |
| `DELETE /warranty-profiles/:id` | `warranty_profiles.delete` |

### Promotions

| Endpoint | Permission |
|---|---|
| `GET /promotions` | `promotions.view` |
| `GET /promotions/:id` | `promotions.view` |
| `POST /promotions` | `promotions.create` |
| `PATCH /promotions/:id` | `promotions.update` |
| `DELETE /promotions/:id` | `promotions.delete` |

### Warehouses and locations

| Endpoint | Permission |
|---|---|
| `GET /warehouses` | `warehouses.view` |
| `GET /warehouses/:id` | `warehouses.view` |
| `POST /warehouses` | `warehouses.create` |
| `PATCH /warehouses/:id` | `warehouses.update` |
| `DELETE /warehouses/:id` | `warehouses.delete` |
| `GET /warehouses/:id/locations` | `warehouse_locations.view` |
| `POST /warehouses/:id/locations` | `warehouse_locations.create` |
| `GET /warehouse-locations/:id` | `warehouse_locations.view` |
| `PATCH /warehouse-locations/:id` | `warehouse_locations.update` |

### Warehouse stock

| Endpoint | Permission |
|---|---|
| `GET /warehouse-stock` | `warehouse_stock.view` |
| `GET /warehouse-stock/:warehouseId/products` | `warehouse_stock.view` |

### Inventory lots

| Endpoint | Permission |
|---|---|
| `GET /inventory-lots` | `inventory_lots.view` |
| `GET /inventory-lots/:id` | `inventory_lots.view` |
| `POST /inventory-lots` | `inventory_lots.create` |
| `PATCH /inventory-lots/:id` | `inventory_lots.update` |
| `DELETE /inventory-lots/:id` | `inventory_lots.delete` |

### Inventory movements

| Endpoint | Permission |
|---|---|
| `GET /inventory-movements` | `inventory_movements.view` |
| `GET /inventory-movements/:id` | `inventory_movements.view` |
| `POST /inventory-movements/adjust` | `inventory_movements.adjust` |
| `POST /inventory-movements/transfer` | `inventory_movements.transfer` |
| `POST /inventory-movements/:id/cancel` | `inventory_movements.cancel` |

### Product serials

| Endpoint | Permission |
|---|---|
| `POST /products/:id/variants/:variantId/serials` | `product_serials.create` |
| `GET /products/:id/variants/:variantId/serials` | `product_serials.view` |
| `GET /product-serials/lookup` | `product_serials.view` |
| `GET /product-serials/:id/history` | `product_serials.view` |
| `PATCH /product-serials/:id` | `product_serials.update` |

## 7. Compatibility behavior for existing roles

The backend now seeds the new permission records and also derives new
inventory permissions from legacy ones during application bootstrap.

Meaning:

- roles that already had `products.view` will automatically receive:
  - `product_variants.view`
  - `variant_attributes.view`
  - `product_serials.view`
- roles that already had `products.create` will automatically receive:
  - `product_variants.create`
  - `variant_attributes.generate`
  - `product_serials.create`
- roles that already had `products.update` will automatically receive:
  - `products.delete`
  - `product_variants.update`
  - `product_variants.delete`
  - `variant_attributes.configure`
  - `product_serials.update`
- roles that already had `inventory_movements.adjust` will automatically
  receive:
  - `inventory_movements.transfer`
  - `inventory_movements.cancel`
- delete permissions for categories, brands, measurement units, price lists,
  product prices, warranty profiles, promotions, warehouses, and lots are also
  derived from their previous `*.update` permissions

Frontend implication:

- after backend restart, old roles should continue working
- from now on, the role UI must show and store the new granular permissions
- do not assume `products.*` still covers variants or serials in UI logic

## 8. Frontend implementation rules

### Roles screen

- fetch the full catalog from `GET /permissions`
- group permissions by `module`
- render `action` as the atomic selectable permission
- do not hide unknown modules or unknown actions
- include the new modules:
  - `product_variants`
  - `variant_attributes`
  - `product_serials`

### Route and action gating

- use the exact permission keys from backend
- do not infer permission access from old generic modules
- check the specific action before rendering page actions, buttons, or forms

Examples:

- show "Create Variant" only with `product_variants.create`
- show "Edit Variant" only with `product_variants.update`
- show "Deactivate Variant" and "Delete Variant Permanently" only with
  `product_variants.delete`
- show "Configure Attributes" only with `variant_attributes.configure`
- show "Generate Variants" only with `variant_attributes.generate`
- show serial registration only with `product_serials.create`
- show transfer action only with `inventory_movements.transfer`
- show cancel movement action only with `inventory_movements.cancel`

### Important distinction for variant delete

Frontend must not treat the two variant delete routes as the same UX:

- `DELETE /products/:id/variants/:variantId`
  - soft behavior
  - deactivates variant
- `DELETE /products/:id/variants/:variantId/permanent`
  - hard behavior
  - physically removes the variant when allowed

Permission for both:

- `product_variants.delete`

UI rule:

- use lifecycle from the variant payload
- show permanent delete only when `lifecycle.can_delete = true`
- show deactivate only when `lifecycle.can_deactivate = true`
- show reactivate only when `lifecycle.can_reactivate = true`

## 9. What the frontend must not assume

- do not assume `products.view` implies variant visibility in UI
- do not assume `products.create` implies serial registration in UI
- do not assume `inventory_movements.adjust` implies transfer or cancel in UI
- do not assume delete actions are always bundled into update
- do not hardcode the inventory permission catalog in the frontend

## 10. Operational note

For the new permissions to appear in the role configuration UI:

1. the backend must be restarted
2. bootstrap must run
3. the permission seed must persist the new catalog
4. derived inventory permissions must be assigned to existing roles

If the frontend does not see the new permissions after deploy, the first check
is whether the backend process has restarted and the seed ran successfully.

## 11. Prompt for Codex Frontend

Use this prompt as the starting point for Codex working on the frontend:

```md
Act as a Senior Frontend Engineer in this frontend repo and align the roles,
permissions, and inventory feature gating with the backend permission contract.

Source of truth:
- C:\Users\cente\OneDrive\Documentos\fastfact\api\docs\inventory-permissions-frontend-alignment.md
- C:\Users\cente\OneDrive\Documentos\fastfact\api\docs\inventory-backend-consolidation-and-frontend-contract.md

Mandatory rules:
1. Use `GET /permissions` as the only permission catalog source.
2. Group permissions by backend `module` and `action`.
3. Do not hardcode old assumptions like `products.*` covering variants,
   serials, or variant attributes.
4. Add UI guards and action visibility for:
   - `product_variants.view/create/update/delete`
   - `variant_attributes.view/configure/generate`
   - `product_serials.view/create/update`
   - `inventory_movements.view/adjust/transfer/cancel`
   - explicit delete permissions for inventory catalogs and entities
5. Variant delete UX:
   - normal delete route = deactivate
   - `/permanent` = hard delete
   - use variant lifecycle to decide which action to show
6. Keep the existing frontend architecture and design language.
7. Do not invent endpoints or fields.

Deliver:
- code changes
- endpoint -> permission mapping in frontend terms
- route/action guards aligned to backend
- final verification of lint/build/tests
```
