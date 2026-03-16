# Inventory Frontend API Contract

## Purpose

This document is the frontend-facing contract for the current `inventory`
backend.

It is meant to answer, with the current code as source of truth:

- which endpoints exist
- which payloads frontend must send
- which response shapes backend returns
- which permissions gate each endpoint
- which inventory errors can come back
- which operational rules affect UI behavior
- which parts are already ledger-based and which parts are still transitional

Use this together with:

- [SYSTEM_MODULES_API_CONTRACT.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/SYSTEM_MODULES_API_CONTRACT.md)
- [INVENTORY_ERP_MULTI_TENANT_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/INVENTORY_ERP_MULTI_TENANT_ARCHITECTURE.md)
- [ERROR_HANDLING_I18N_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/ERROR_HANDLING_I18N_ARCHITECTURE.md)
- [ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md)

Primary backend source references used for this document:

- [inventory-movements.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/controllers/inventory-movements.controller.ts)
- [inventory-movements.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/inventory-movements.service.ts)
- [inventory-transfers.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/inventory-transfers.service.ts)
- [inventory-adjustments.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/inventory-adjustments.service.ts)
- [inventory-ledger.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/inventory-ledger.service.ts)
- [warehouse-stock.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/warehouse-stock.service.ts)
- [products.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/products.service.ts)
- [warehouses.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/warehouses.service.ts)
- [inventory-lots.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/inventory-lots.service.ts)
- [pricing.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/pricing.service.ts)
- [promotions.service.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/inventory/services/promotions.service.ts)
- [error-translations.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/common/i18n/error-translations.ts)

## Global Inventory Rules

### Auth transport

- inventory uses the same cookie-based auth as the rest of the backend
- frontend must send requests with credentials
- `fetch`: `credentials: 'include'`
- `axios`: `withCredentials: true`

### Tenant awareness

- all inventory endpoints are tenant-aware
- effective tenant is always resolved by backend
- in normal tenant mode, the active tenant is `auth/me.business_id`
- in `tenant_context`, platform admins operate using `acting_business_id`
- frontend must not send `business_id`, `acting_business_id` or
  `acting_branch_id` in inventory CRUD payloads

### Branch scope

Inventory is company-owned, but some reads and writes are constrained by branch
access.

Important behavior:

- `GET /warehouses`
- `GET /warehouse-stock`
- `GET /inventory-lots`
- `GET /inventory-movements`

only return rows allowed by the authenticated branch scope.

For write operations such as adjustments and transfers, backend also validates
that the selected warehouse is operationally allowed for the acting branch via
`warehouse_branch_links`.

### Codes and auto-generation

Frontend may send manual `code` values, but it does not have to.

Current behavior:

- if `code` is omitted for company-scoped entities, backend auto-generates it
- codes are business-scoped, not global across all companies
- the same code may exist in two different companies
- manual codes are validated by generic format and expected prefix

Current prefixes:

- brands: `MK`
- measurement units: `MU`
- product categories: `CG`
- tax profiles: `TF`
- warranty profiles: `WP`
- products: `PD`
- price lists: `PL`
- promotions: `PN`
- warehouses: `WH`
- warehouse locations: `WL`
- inventory lots: `LT`
- legacy inventory movements: `IM`
- ledger movement headers: `MOVE`

Generic code pattern:

- `^[A-Z]{2}-\\d{4,}$`

Important:

- this pattern is the current DTO validation for user-provided manual codes
- ledger movement header codes like `MOVE-0001` are backend-generated internal
  codes and are not created through those CRUD DTO fields

Frontend recommendation:

- if manual code entry is not needed, omit `code`
- if manual code entry is enabled, validate both:
  - generic code format
  - expected prefix for that module

### Product master vs default stockable variant

Current backend phase is transitional but intentional:

- `products` is still the frontend-facing master catalog
- backend automatically creates or syncs one default `product_variant`
- stock and ledger reads already expose `product_variant`
- many write endpoints still receive `product_id`, not `product_variant_id`

Frontend implication:

- product maintenance screens can still work against `products`
- stock and movement screens must be ready to consume `product_variant`
- frontend does not need variant management UI yet for the MVP

### Delete policy

Inventory core is soft-operational in this phase:

- there are no delete endpoints for inventory masters
- deactivation is done with `is_active`
- movement history is append-only
- posted movements are never edited in place
- cancellations are compensating movements

### Error envelope

Inventory uses the same global envelope as the rest of the backend:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "PRODUCT_SKU_DUPLICATE",
  "messageKey": "inventory.product_sku_duplicate",
  "message": "Ya existe un producto con ese SKU.",
  "details": {
    "field": "sku"
  },
  "path": "/products",
  "timestamp": "2026-03-14T12:00:00.000Z",
  "requestId": "..."
}
```

Validation errors use the same `VALIDATION_ERROR` envelope with `details[]`.

Frontend error rules:

- use `message` as the main text
- use `details[].message` for field-level mapping when validation errors return
  an array
- use `details.field` when backend sends a single error object for one field
- keep `requestId` available in debug/support UI
- do not replace backend-translated inventory messages with local hardcoded
  copies

## Permission Map

Catalogs:

- `brands.view`
- `brands.create`
- `brands.update`
- `measurement_units.view`
- `measurement_units.create`
- `measurement_units.update`
- `categories.view`
- `categories.create`
- `categories.update`
- `tax_profiles.view`
- `tax_profiles.create`
- `tax_profiles.update`
- `warranty_profiles.view`
- `warranty_profiles.create`
- `warranty_profiles.update`

Products, pricing and promotions:

- `products.view`
- `products.create`
- `products.update`
- `price_lists.view`
- `price_lists.create`
- `price_lists.update`
- `product_prices.view`
- `product_prices.create`
- `product_prices.update`
- `promotions.view`
- `promotions.create`
- `promotions.update`

Warehouses, stock, lots and movements:

- `warehouses.view`
- `warehouses.create`
- `warehouses.update`
- `warehouse_locations.view`
- `warehouse_locations.create`
- `warehouse_locations.update`
- `warehouse_stock.view`
- `inventory_lots.view`
- `inventory_lots.create`
- `inventory_lots.update`
- `inventory_movements.view`
- `inventory_movements.adjust`

Important:

- `POST /inventory-movements/adjust` uses `inventory_movements.adjust`
- `POST /inventory-movements/transfer` also uses `inventory_movements.adjust`
- `POST /inventory-movements/:id/cancel` also uses
  `inventory_movements.adjust`

## Enum Catalog

### ProductType

- `product`
- `service`

### PriceListKind

- `retail`
- `wholesale`
- `credit`
- `special`

### PromotionType

- `percentage`
- `fixed_amount`
- `buy_x_get_y`
- `price_override`

### TaxType

- `iva`
- `exento`
- `no_sujeto`
- `specific_tax`

### TaxProfileItemKind

- `goods`
- `service`

### WarrantyDurationUnit

- `days`
- `months`
- `years`

### WarehousePurpose

Returned today by warehouse serializer:

- `saleable`
- `reserve`
- `damaged`
- `returns`
- `transit`
- `production`
- `general_storage`

Important:

- current warehouse create/update DTOs do not expose `purpose`
- frontend should treat `purpose` as read-only in the current phase
- new warehouses currently default to backend entity default

### Legacy InventoryMovementType

Used by legacy movement rows and adjustment endpoint payloads:

- `purchase_in`
- `sale_out`
- `adjustment_in`
- `adjustment_out`
- `transfer_in`
- `transfer_out`
- `return_in`
- `return_out`

Important:

- `POST /inventory-movements/adjust` only accepts:
  - `adjustment_in`
  - `adjustment_out`

### Ledger InventoryMovementHeaderType

Used by `GET /inventory-movements` and ledger headers:

- `purchase_receipt`
- `sales_dispatch`
- `stock_adjustment`
- `transfer`
- `manual_correction`

Future-ready enum values already exist in backend:

- `reservation`
- `release`
- `return_in`
- `return_out`
- `purchase_expected`
- `sales_allocated`

### InventoryMovementStatus

- `draft`
- `posted`
- `cancelled`

Future-ready statuses already exist in backend:

- `in_transit`
- `received`
- `partially_received`

Current MVP behavior:

- adjustment write path posts movement headers with `posted`
- transfer write path posts movement headers with `posted`
- cancelling a posted movement marks the original as `cancelled` and creates a
  new compensating movement with `posted`

## Endpoint Map

### Catalogs

- `GET /brands`
- `POST /brands`
- `GET /brands/:id`
- `PATCH /brands/:id`
- `GET /measurement-units`
- `POST /measurement-units`
- `GET /measurement-units/:id`
- `PATCH /measurement-units/:id`
- `GET /product-categories`
- `POST /product-categories`
- `GET /product-categories/tree`
- `GET /product-categories/:id`
- `PATCH /product-categories/:id`
- `GET /tax-profiles`
- `POST /tax-profiles`
- `GET /tax-profiles/:id`
- `PATCH /tax-profiles/:id`
- `GET /warranty-profiles`
- `POST /warranty-profiles`
- `GET /warranty-profiles/:id`
- `PATCH /warranty-profiles/:id`

### Products, pricing and promotions

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`
- `GET /products/:id/prices`
- `POST /products/:id/prices`
- `PATCH /product-prices/:id`
- `GET /price-lists`
- `POST /price-lists`
- `GET /price-lists/:id`
- `PATCH /price-lists/:id`
- `GET /promotions`
- `POST /promotions`
- `GET /promotions/:id`
- `PATCH /promotions/:id`

### Warehouses, stock, lots and movements

- `GET /warehouses`
- `POST /warehouses`
- `GET /warehouses/:id`
- `PATCH /warehouses/:id`
- `GET /warehouses/:id/locations`
- `POST /warehouses/:id/locations`
- `GET /warehouse-locations/:id`
- `PATCH /warehouse-locations/:id`
- `GET /warehouse-stock`
- `GET /warehouse-stock/:warehouseId/products`
- `GET /inventory-lots`
- `POST /inventory-lots`
- `GET /inventory-lots/:id`
- `PATCH /inventory-lots/:id`
- `GET /inventory-movements`
- `POST /inventory-movements/adjust`
- `POST /inventory-movements/transfer`
- `POST /inventory-movements/:id/cancel`

## Shared Frontend Rules

- submit exact DTO field names documented here
- prefer omitting optional fields instead of sending empty strings
- send ISO dates or `YYYY-MM-DD` where documented
- do not send `business_id` in payloads
- do not assume product visibility by branch table exists in MVP
- treat `product` as master catalog and `product_variant` as stock-facing read
  model
- if you need to cancel a movement shown in `GET /inventory-movements`, use
  `header_id`, not the row `id`
- `GET /inventory-movements` returns one row per ledger line, not one row per
  header
- a transfer therefore appears as two rows with the same `header_id` and same
  `code`

## Catalog Contracts

### Brands

Endpoints:

- `GET /brands`
- `POST /brands`
- `GET /brands/:id`
- `PATCH /brands/:id`

Create body:

```json
{
  "code": "MK-0001",
  "name": "Michelin",
  "description": "Marca premium de llantas",
  "is_active": true
}
```

Update body:

- same fields, all optional

Response shape:

```json
{
  "id": 1,
  "code": "MK-0001",
  "business_id": 1,
  "name": "Michelin",
  "description": "Marca premium de llantas",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `BRAND_NAME_DUPLICATE`
- `BRAND_NOT_FOUND`

### Measurement units

Endpoints:

- `GET /measurement-units`
- `POST /measurement-units`
- `GET /measurement-units/:id`
- `PATCH /measurement-units/:id`

Create body:

```json
{
  "code": "MU-0001",
  "name": "Kilogramo",
  "symbol": "kg",
  "is_active": true
}
```

Response shape:

```json
{
  "id": 1,
  "code": "MU-0001",
  "business_id": 1,
  "name": "Kilogramo",
  "symbol": "kg",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `MEASUREMENT_UNIT_NAME_OR_SYMBOL_DUPLICATE`
- `MEASUREMENT_UNIT_NOT_FOUND`

### Product categories

Endpoints:

- `GET /product-categories`
- `POST /product-categories`
- `GET /product-categories/tree`
- `GET /product-categories/:id`
- `PATCH /product-categories/:id`

Create body:

```json
{
  "code": "CG-0001",
  "name": "Llantas",
  "description": "Categoria principal",
  "parent_id": null,
  "is_active": true
}
```

Flat response shape:

```json
{
  "id": 1,
  "code": "CG-0001",
  "business_id": 1,
  "name": "Llantas",
  "description": "Categoria principal",
  "parent_id": null,
  "level": 0,
  "path": "/1/",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Tree response from `GET /product-categories/tree`:

- same category shape plus nested `children`

Common business errors:

- `CATEGORY_NAME_DUPLICATE`
- `CATEGORY_NOT_FOUND`
- `CATEGORY_PARENT_SELF_INVALID`
- `CATEGORY_PARENT_DESCENDANT_INVALID`

### Tax profiles

Endpoints:

- `GET /tax-profiles`
- `POST /tax-profiles`
- `GET /tax-profiles/:id`
- `PATCH /tax-profiles/:id`

Create body:

```json
{
  "code": "TF-0001",
  "name": "IVA General Bienes",
  "description": "Perfil fiscal para bienes gravados al 13%",
  "cabys_code": "1234567890123",
  "item_kind": "goods",
  "tax_type": "iva",
  "iva_rate_code": "08",
  "iva_rate": 13,
  "requires_cabys": true,
  "allows_exoneration": true,
  "has_specific_tax": false,
  "specific_tax_name": null,
  "specific_tax_rate": null,
  "is_active": true
}
```

Response shape:

```json
{
  "id": 1,
  "code": "TF-0001",
  "business_id": 1,
  "name": "IVA General Bienes",
  "description": "Perfil fiscal para bienes gravados al 13%",
  "cabys_code": "1234567890123",
  "item_kind": "goods",
  "tax_type": "iva",
  "iva_rate_code": "08",
  "iva_rate": 13,
  "requires_cabys": true,
  "allows_exoneration": true,
  "has_specific_tax": false,
  "specific_tax_name": null,
  "specific_tax_rate": null,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `TAX_PROFILE_NAME_DUPLICATE`
- `TAX_PROFILE_NOT_FOUND`
- `TAX_PROFILE_IVA_RATE_REQUIRED`
- `TAX_PROFILE_SPECIFIC_FIELDS_REQUIRED`

### Warranty profiles

Endpoints:

- `GET /warranty-profiles`
- `POST /warranty-profiles`
- `GET /warranty-profiles/:id`
- `PATCH /warranty-profiles/:id`

Create body:

```json
{
  "code": "WP-0001",
  "name": "Garantia Basica",
  "duration_value": 12,
  "duration_unit": "months",
  "coverage_notes": "Cubre defectos de fabrica",
  "is_active": true
}
```

Response shape:

```json
{
  "id": 1,
  "code": "WP-0001",
  "business_id": 1,
  "name": "Garantia Basica",
  "duration_value": 12,
  "duration_unit": "months",
  "coverage_notes": "Cubre defectos de fabrica",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `WARRANTY_PROFILE_NAME_DUPLICATE`
- `WARRANTY_PROFILE_NOT_FOUND`

## Products, Pricing And Promotions

### Products

Endpoints:

- `GET /products`
- `POST /products`
- `GET /products/:id`
- `PATCH /products/:id`

Create body:

```json
{
  "code": "PD-0001",
  "type": "product",
  "name": "Llanta 185/65 R15",
  "description": "Llanta radial para automovil",
  "category_id": 2,
  "brand_id": 1,
  "sku": "SKU-LL-185",
  "barcode": "7501234567890",
  "stock_unit_id": 1,
  "sale_unit_id": 1,
  "tax_profile_id": 1,
  "track_inventory": true,
  "track_lots": false,
  "track_expiration": false,
  "allow_negative_stock": false,
  "has_warranty": false,
  "warranty_profile_id": null,
  "is_active": true
}
```

Update body:

- same fields, all optional

Response shape:

```json
{
  "id": 1,
  "code": "PD-0001",
  "business_id": 1,
  "type": "product",
  "name": "Llanta 185/65 R15",
  "description": "Llanta radial para automovil",
  "category": {
    "id": 2,
    "code": "CG-0002",
    "name": "SUV"
  },
  "brand": {
    "id": 1,
    "code": "MK-0001",
    "name": "Michelin"
  },
  "sku": "SKU-LL-185",
  "barcode": "7501234567890",
  "stock_unit": {
    "id": 1,
    "code": "MU-0001",
    "name": "Unidad",
    "symbol": "un"
  },
  "sale_unit": {
    "id": 1,
    "code": "MU-0001",
    "name": "Unidad",
    "symbol": "un"
  },
  "tax_profile": {
    "id": 1,
    "code": "TF-0001",
    "name": "IVA General Bienes",
    "item_kind": "goods",
    "tax_type": "iva",
    "cabys_code": "1234567890123"
  },
  "track_inventory": true,
  "track_lots": false,
  "track_expiration": false,
  "allow_negative_stock": false,
  "has_warranty": false,
  "warranty_profile": null,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Important backend rules:

- backend auto-creates or syncs one default `product_variant`
- default variant uses:
  - `variant_name = "Default"`
  - `sku = product.sku` when present
  - otherwise autogenerated `SKU-000001` style based on product id
- current product response does not embed variants
- `sku` must be unique per business
- `barcode` must be unique per business
- product type must be compatible with tax profile item kind
- if `type = service`, backend forces:
  - `track_inventory = false`
  - `track_lots = false`
  - `track_expiration = false`
  - `allow_negative_stock = false`
- if `track_lots = true`, `track_inventory` must also be true
- if `track_expiration = true`, `track_lots` must also be true
- if `has_warranty = true`, `warranty_profile_id` is required
- current MVP does not support unit conversion between stock and sale units
- if both `stock_unit_id` and `sale_unit_id` are present, they must be equal

Common business errors:

- `PRODUCT_NOT_FOUND`
- `PRODUCT_SKU_DUPLICATE`
- `PRODUCT_BARCODE_DUPLICATE`
- `PRODUCT_TAX_PROFILE_GOODS_REQUIRED`
- `PRODUCT_TAX_PROFILE_SERVICE_REQUIRED`
- `PRODUCT_LOT_TRACKING_REQUIRES_INVENTORY`
- `PRODUCT_EXPIRATION_REQUIRES_LOTS`
- `PRODUCT_WARRANTY_PROFILE_REQUIRED`
- `PRODUCT_UNIT_CONVERSION_NOT_SUPPORTED`

### Price lists

Endpoints:

- `GET /price-lists`
- `POST /price-lists`
- `GET /price-lists/:id`
- `PATCH /price-lists/:id`

Create body:

```json
{
  "code": "PL-0001",
  "name": "Precio Retail",
  "kind": "retail",
  "currency": "CRC",
  "is_default": true,
  "is_active": true
}
```

Response shape:

```json
{
  "id": 1,
  "code": "PL-0001",
  "business_id": 1,
  "name": "Precio Retail",
  "kind": "retail",
  "currency": "CRC",
  "is_default": true,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Important current-phase note:

- pricing is still product-level in current backend
- it is not yet using `price_list_assignments`
- it is not yet variant-level pricing

Common business errors:

- `PRICE_LIST_NAME_DUPLICATE`
- `PRICE_LIST_NOT_FOUND`

### Product prices

Endpoints:

- `GET /products/:id/prices`
- `POST /products/:id/prices`
- `PATCH /product-prices/:id`

Create body:

```json
{
  "price_list_id": 1,
  "price": 15000,
  "min_quantity": 6,
  "valid_from": "2026-03-10T00:00:00.000Z",
  "valid_to": "2026-12-31T23:59:59.000Z",
  "is_active": true
}
```

Response shape:

```json
{
  "id": 1,
  "business_id": 1,
  "product_id": 1,
  "price_list": {
    "id": 1,
    "code": "PL-0001",
    "name": "Precio Retail",
    "kind": "retail",
    "currency": "CRC"
  },
  "price": 15000,
  "min_quantity": 6,
  "valid_from": "2026-03-10T00:00:00.000Z",
  "valid_to": "2026-12-31T23:59:59.000Z",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `PRODUCT_PRICE_NOT_FOUND`
- `PRICE_LIST_NOT_FOUND`
- `PRODUCT_NOT_FOUND`
- `PRICE_VALID_RANGE_INVALID`

### Promotions

Endpoints:

- `GET /promotions`
- `POST /promotions`
- `GET /promotions/:id`
- `PATCH /promotions/:id`

Create body:

```json
{
  "code": "PN-0001",
  "name": "Promo 3x2 Bebidas",
  "type": "buy_x_get_y",
  "valid_from": "2026-03-10T00:00:00.000Z",
  "valid_to": "2026-03-31T23:59:59.000Z",
  "is_active": true,
  "items": [
    {
      "product_id": 1,
      "min_quantity": 3,
      "bonus_quantity": 1
    }
  ]
}
```

Response shape:

```json
{
  "id": 1,
  "code": "PN-0001",
  "business_id": 1,
  "name": "Promo 3x2 Bebidas",
  "type": "buy_x_get_y",
  "valid_from": "2026-03-10T00:00:00.000Z",
  "valid_to": "2026-03-31T23:59:59.000Z",
  "is_active": true,
  "items": [
    {
      "id": 10,
      "product": {
        "id": 1,
        "code": "PD-0001",
        "name": "Bebida 600ml"
      },
      "min_quantity": 3,
      "discount_value": null,
      "override_price": null,
      "bonus_quantity": 1
    }
  ],
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `PROMOTION_NAME_DUPLICATE`
- `PROMOTION_NOT_FOUND`
- `PROMOTION_DUPLICATE_ITEMS`
- `PROMOTION_ITEMS_OUTSIDE_BUSINESS`
- `PROMOTION_DISCOUNT_VALUE_REQUIRED`
- `PROMOTION_OVERRIDE_PRICE_REQUIRED`
- `PROMOTION_BUY_X_GET_Y_FIELDS_REQUIRED`
- `PROMOTION_DATE_RANGE_INVALID`

## Warehouses, Stock, Lots And Movements

### Warehouses

Endpoints:

- `GET /warehouses`
- `POST /warehouses`
- `GET /warehouses/:id`
- `PATCH /warehouses/:id`

Create body:

```json
{
  "code": "WH-0001",
  "branch_id": 1,
  "name": "Bodega Principal",
  "description": "Bodega general de la sucursal",
  "uses_locations": true,
  "is_default": true,
  "is_active": true
}
```

Update body:

- same fields, all optional

Response shape:

```json
{
  "id": 1,
  "code": "WH-0001",
  "business_id": 1,
  "branch_id": 1,
  "name": "Bodega Principal",
  "description": "Bodega general de la sucursal",
  "purpose": "general_storage",
  "uses_locations": true,
  "is_default": true,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Important current-phase note:

- backend serializer returns `purpose`
- current create/update DTOs do not let frontend set `purpose`
- frontend should treat it as read-only for now

Common business errors:

- `WAREHOUSE_NOT_FOUND`
- `WAREHOUSE_NAME_DUPLICATE`
- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`

### Warehouse locations

Endpoints:

- `GET /warehouses/:id/locations`
- `POST /warehouses/:id/locations`
- `GET /warehouse-locations/:id`
- `PATCH /warehouse-locations/:id`

Create body:

```json
{
  "code": "WL-0001",
  "name": "Pasillo A - Rack 1",
  "description": "Zona frontal de picking",
  "zone": "A",
  "aisle": "1",
  "rack": "R1",
  "level": "3",
  "position": "P-05",
  "barcode": "LOC-001",
  "is_picking_area": true,
  "is_receiving_area": false,
  "is_dispatch_area": false,
  "is_active": true
}
```

Response shape:

```json
{
  "id": 1,
  "code": "WL-0001",
  "business_id": 1,
  "branch_id": 1,
  "warehouse_id": 1,
  "name": "Pasillo A - Rack 1",
  "description": "Zona frontal de picking",
  "zone": "A",
  "aisle": "1",
  "rack": "R1",
  "level": "3",
  "position": "P-05",
  "barcode": "LOC-001",
  "is_picking_area": true,
  "is_receiving_area": false,
  "is_dispatch_area": false,
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Common business errors:

- `WAREHOUSE_LOCATIONS_DISABLED`
- `WAREHOUSE_LOCATION_NOT_FOUND`
- `WAREHOUSE_LOCATION_NAME_DUPLICATE`
- `WAREHOUSE_LOCATION_MISMATCH`

### Warehouse stock

Endpoints:

- `GET /warehouse-stock`
- `GET /warehouse-stock/:warehouseId/products`

Response shape:

```json
[
  {
    "id": 1,
    "business_id": 1,
    "branch_id": 1,
    "warehouse": {
      "id": 1,
      "code": "WH-0001",
      "name": "Bodega Principal"
    },
    "product_variant": {
      "id": 10,
      "sku": "SKU-LL-185",
      "barcode": "7501234567890",
      "variant_name": "Default",
      "is_default": true
    },
    "product": {
      "id": 1,
      "code": "PD-0001",
      "name": "Llanta 185/65 R15",
      "type": "product"
    },
    "quantity": 25,
    "reserved_quantity": 5,
    "incoming_quantity": 0,
    "outgoing_quantity": 0,
    "available_quantity": 20,
    "projected_quantity": 25,
    "min_stock": 2,
    "max_stock": 50,
    "updated_at": "..."
  }
]
```

Important notes:

- this endpoint already reads from `inventory_balances`
- `quantity` is current `on_hand_quantity`
- `available_quantity = quantity - reserved_quantity`
- `projected_quantity = quantity + incoming_quantity - outgoing_quantity`
- `min_stock` and `max_stock` are still bridged from legacy stock settings and
  may be `null`
- frontend should treat `product_variant` as the stock-facing identifier

Common business errors:

- `WAREHOUSE_NOT_FOUND`
- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`

### Inventory lots

Endpoints:

- `GET /inventory-lots`
- `POST /inventory-lots`
- `GET /inventory-lots/:id`
- `PATCH /inventory-lots/:id`

Create body:

```json
{
  "code": "LT-0001",
  "warehouse_id": 1,
  "location_id": 1,
  "product_id": 1,
  "lot_number": "L-2026-0001",
  "expiration_date": "2026-12-31",
  "manufacturing_date": "2026-01-10",
  "received_at": "2026-03-10T15:00:00.000Z",
  "initial_quantity": 25,
  "unit_cost": 3500,
  "supplier_contact_id": 3,
  "is_active": true
}
```

Update body:

- same fields except `warehouse_id`, `product_id` and `initial_quantity`
- update is partial

Response shape:

```json
{
  "id": 1,
  "code": "LT-0001",
  "business_id": 1,
  "branch_id": 1,
  "warehouse": {
    "id": 1,
    "code": "WH-0001",
    "name": "Bodega Principal"
  },
  "location": {
    "id": 1,
    "code": "WL-0001",
    "name": "Pasillo A - Rack 1"
  },
  "product": {
    "id": 1,
    "code": "PD-0001",
    "name": "Llanta 185/65 R15"
  },
  "lot_number": "L-2026-0001",
  "expiration_date": "2026-12-31",
  "manufacturing_date": "2026-01-10",
  "received_at": "2026-03-10T15:00:00.000Z",
  "initial_quantity": 25,
  "current_quantity": 25,
  "unit_cost": 3500,
  "supplier_contact": {
    "id": 3,
    "code": "CT-0003",
    "name": "Proveedor Central"
  },
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

Important business rules:

- warehouse must be operable in current scope
- optional location must belong to the warehouse
- product must belong to business and have inventory tracking enabled
- product must have `track_lots = true`
- if product has `track_expiration = true`, `expiration_date` is required
- lot number must be unique inside the same warehouse for the same product
- if `supplier_contact_id` is sent, contact must belong to business and be
  supplier-capable
- if `initial_quantity > 0`, backend automatically creates an
  `adjustment_in` movement for initial balance

Common business errors:

- `PRODUCT_INVENTORY_TRACKING_REQUIRED`
- `PRODUCT_LOT_TRACKING_REQUIRED`
- `INVENTORY_LOT_EXPIRATION_REQUIRED`
- `INVENTORY_LOT_NUMBER_DUPLICATE`
- `SUPPLIER_CONTACT_NOT_FOUND`
- `SUPPLIER_CONTACT_TYPE_INVALID`
- `WAREHOUSE_LOCATION_MISMATCH`
- `INVENTORY_LOT_NOT_FOUND`

## Inventory Movements

This area currently has three different response styles. Frontend must not
assume one uniform serializer yet.

### 1. `GET /inventory-movements`

This endpoint is ledger-based.

Important behavior:

- returns one row per `inventory_movement_line`
- a transfer appears as two rows
- `id` is the movement line id
- `header_id` is the movement header id
- use `header_id` for header-level actions such as cancel

Response shape:

```json
[
  {
    "id": 101,
    "code": "MOVE-0001",
    "header_id": 55,
    "business_id": 1,
    "branch_id": 1,
    "branch": {
      "id": 1,
      "code": "BR-0001",
      "business_name": "FastFact Escazu"
    },
    "warehouse": {
      "id": 1,
      "code": "WH-0001",
      "name": "Bodega Principal"
    },
    "product_variant": {
      "id": 10,
      "sku": "SKU-LL-185",
      "barcode": "7501234567890",
      "variant_name": "Default",
      "is_default": true
    },
    "product": {
      "id": 1,
      "code": "PD-0001",
      "name": "Llanta 185/65 R15",
      "type": "product"
    },
    "inventory_lot": null,
    "movement_type": "stock_adjustment",
    "status": "posted",
    "reference_type": "inventory_lot",
    "reference_id": 10,
    "reference_number": null,
    "line_no": 1,
    "quantity": 5,
    "unit_cost": null,
    "total_cost": null,
    "on_hand_delta": 5,
    "reserved_delta": 0,
    "incoming_delta": 0,
    "outgoing_delta": 0,
    "linked_line_id": null,
    "previous_quantity": null,
    "new_quantity": null,
    "notes": "Ajuste por conteo fisico",
    "created_by": {
      "id": 2,
      "code": "US-0002",
      "name": "Supervisor",
      "email": "supervisor@empresa.com"
    },
    "occurred_at": "...",
    "created_at": "..."
  }
]
```

Important current-phase note:

- `inventory_lot` is currently always `null` in this ledger list serializer
- if UI needs lot detail today, do not infer it from this list response

### 2. `POST /inventory-movements/adjust`

This endpoint still returns the legacy single movement serializer.

Body:

```json
{
  "warehouse_id": 1,
  "location_id": 1,
  "product_id": 1,
  "inventory_lot_id": 10,
  "movement_type": "adjustment_in",
  "quantity": 5,
  "reference_type": "inventory_lot",
  "reference_id": 10,
  "notes": "Ajuste por conteo fisico"
}
```

Response shape:

```json
{
  "id": 100,
  "code": "IM-000100",
  "business_id": 1,
  "branch_id": 1,
  "warehouse": {
    "id": 1,
    "code": "WH-0001",
    "name": "Bodega Principal"
  },
  "location": {
    "id": 1,
    "code": "WL-0001",
    "name": "Pasillo A - Rack 1"
  },
  "product": {
    "id": 1,
    "code": "PD-0001",
    "name": "Llanta 185/65 R15"
  },
  "inventory_lot": {
    "id": 10,
    "code": "LT-0001",
    "lot_number": "L-2026-0001"
  },
  "movement_type": "adjustment_in",
  "reference_type": "inventory_lot",
  "reference_id": 10,
  "quantity": 5,
  "previous_quantity": 20,
  "new_quantity": 25,
  "notes": "Ajuste por conteo fisico",
  "created_by": {
    "id": 2,
    "code": "US-0002",
    "name": "Supervisor",
    "email": "supervisor@empresa.com"
  },
  "created_at": "..."
}
```

Backend rules:

- `movement_type` must be exactly `adjustment_in` or `adjustment_out`
- product must be inventory-enabled
- if product tracks lots, `inventory_lot_id` is required
- if product does not track lots, sending `inventory_lot_id` is rejected
- if location is sent, it must belong to warehouse
- if lot is sent, it must belong to same warehouse and same product
- if product disallows negative stock, adjustment cannot take balance below zero
- if lot is used, lot balance also cannot go negative
- backend also posts a ledger movement header and line under the hood

Common business errors:

- `INVENTORY_ADJUSTMENT_TYPE_INVALID`
- `WAREHOUSE_NOT_FOUND`
- `WAREHOUSE_LOCATION_NOT_FOUND`
- `WAREHOUSE_LOCATION_MISMATCH`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_INVENTORY_TRACKING_REQUIRED`
- `INVENTORY_LOT_REQUIRED`
- `PRODUCT_LOT_TRACKING_REQUIRED`
- `INVENTORY_LOT_NOT_FOUND`
- `INVENTORY_LOT_WAREHOUSE_MISMATCH`
- `INVENTORY_LOT_PRODUCT_MISMATCH`
- `INVENTORY_LOT_LOCATION_MISMATCH`
- `INVENTORY_NEGATIVE_STOCK_FORBIDDEN`
- `INVENTORY_LOT_NEGATIVE_BALANCE_FORBIDDEN`
- `TENANT_MISMATCH`
- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`

### 3. `POST /inventory-movements/transfer`

This endpoint creates an immediate warehouse-to-warehouse transfer.

Body:

```json
{
  "origin_warehouse_id": 1,
  "destination_warehouse_id": 2,
  "product_id": 1,
  "quantity": 5,
  "unit_cost": 12500,
  "reference_type": "transfer_request",
  "reference_id": 18,
  "notes": "Traslado a sucursal secundaria"
}
```

Response shape:

```json
{
  "id": 55,
  "code": "MOVE-0002",
  "business_id": 1,
  "branch_id": 1,
  "movement_type": "transfer",
  "status": "posted",
  "occurred_at": "...",
  "notes": "Traslado a sucursal secundaria",
  "lines": [
    {
      "id": 201,
      "line_no": 1,
      "warehouse_id": 1,
      "product_variant_id": 10,
      "quantity": 5,
      "unit_cost": 12500,
      "total_cost": 62500,
      "on_hand_delta": -5,
      "linked_line_id": 202
    },
    {
      "id": 202,
      "line_no": 2,
      "warehouse_id": 2,
      "product_variant_id": 10,
      "quantity": 5,
      "unit_cost": 12500,
      "total_cost": 62500,
      "on_hand_delta": 5,
      "linked_line_id": 201
    }
  ],
  "legacy_movement_ids": [501, 502]
}
```

Backend rules:

- origin and destination warehouses cannot be the same
- backend resolves the default `product_variant` from `product_id`
- movement is immediate, not transit-based
- exactly two ledger lines are posted
- both lines share one header
- first line is origin `on_hand_delta = -quantity`
- second line is destination `on_hand_delta = +quantity`
- both lines get `linked_line_id`
- if negative stock would result in origin and variant disallows it, request
  fails

Common business errors:

- `TRANSFER_WAREHOUSE_DUPLICATE`
- `WAREHOUSE_NOT_FOUND`
- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_INVENTORY_TRACKING_REQUIRED`
- `INSUFFICIENT_STOCK`
- `TENANT_MISMATCH`
- `TRANSFER_LINE_COUNT_INVALID`
- `TRANSFER_LINE_CONSISTENCY_INVALID`

### 4. `POST /inventory-movements/:id/cancel`

This cancels a posted ledger header through a compensating movement.

Important:

- `:id` must be the movement header id
- if frontend is cancelling from `GET /inventory-movements`, use `header_id`
- do not send the line `id`

Body:

```json
{
  "notes": "Se revierte por error de digitacion"
}
```

Body is optional.

Response shape:

```json
{
  "success": true,
  "cancelled_movement": {
    "id": 55,
    "code": "MOVE-0002",
    "status": "cancelled"
  },
  "compensating_movement": {
    "id": 56,
    "code": "MOVE-0003",
    "business_id": 1,
    "branch_id": 1,
    "movement_type": "transfer",
    "status": "posted",
    "reference_type": "inventory_movement_cancellation",
    "reference_id": 55,
    "reference_number": "MOVE-0002",
    "occurred_at": "...",
    "notes": "Cancellation for MOVE-0002: Se revierte por error de digitacion",
    "lines": [
      {
        "id": 203,
        "code": "MOVE-0003",
        "header_id": 56,
        "business_id": 1,
        "branch_id": 1,
        "movement_type": "transfer",
        "status": "posted",
        "line_no": 1,
        "quantity": 5,
        "on_hand_delta": 5,
        "linked_line_id": 204
      },
      {
        "id": 204,
        "code": "MOVE-0003",
        "header_id": 56,
        "business_id": 1,
        "branch_id": 1,
        "movement_type": "transfer",
        "status": "posted",
        "line_no": 2,
        "quantity": 5,
        "on_hand_delta": -5,
        "linked_line_id": 203
      }
    ]
  }
}
```

Backend rules:

- only `posted` movement headers can be cancelled
- already cancelled headers cannot be cancelled again
- original ledger lines are not edited or deleted
- backend creates a compensating movement with inverse deltas
- original header status changes to `cancelled`
- warehouse balances are updated in the same transaction

Common business errors:

- `INVENTORY_MOVEMENT_NOT_FOUND`
- `INVENTORY_MOVEMENT_POSTED_REQUIRED`
- `INVENTORY_MOVEMENT_ALREADY_CANCELLED`
- `INVENTORY_MOVEMENT_LINES_REQUIRED`
- `INVENTORY_MOVEMENT_RELATION_MISSING`
- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`
- `TENANT_MISMATCH`

## Movement Engine Rules That Affect Frontend

These rules are backend-enforced and frontend should respect them in UI flows.

### Balance update rule

Each ledger line updates one balance row:

- `on_hand_quantity += on_hand_delta`
- `reserved_quantity += reserved_delta`
- `incoming_quantity += incoming_delta`
- `outgoing_quantity += outgoing_delta`

If the balance row does not exist, backend creates it automatically.

### Tenant consistency rule

Before posting a movement, backend validates:

- warehouse belongs to active business
- branch belongs to active business
- product variant belongs to active business

Failure returns:

- `TENANT_MISMATCH`

### Warehouse allowed for branch rule

Before posting a movement, backend validates operational branch usage through
`warehouse_branch_links`.

Failure returns:

- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`

### Negative stock rule

If the resolved `product_variant.allow_negative_stock = false`, backend rejects
any movement that would leave `on_hand_quantity < 0`.

Typical failure:

- `INSUFFICIENT_STOCK`
- or `INVENTORY_NEGATIVE_STOCK_FORBIDDEN` on legacy adjustment path

### Transfer consistency rule

For ledger transfers, backend enforces:

- exactly 2 lines
- origin warehouse line with negative `on_hand_delta`
- destination warehouse line with positive `on_hand_delta`
- same quantity on both lines
- cross-linked `linked_line_id`

Failures:

- `TRANSFER_LINE_COUNT_INVALID`
- `TRANSFER_LINE_CONSISTENCY_INVALID`

### Cost rule

If `unit_cost` is sent:

- `total_cost = quantity * unit_cost`

If `unit_cost` is omitted:

- `total_cost = null`

There is no full inventory valuation engine yet in this phase.

### Cancellation rule

Posted movements are immutable.

Backend never edits posted lines in place. Cancellation always creates a new
compensating movement.

### Atomicity rule

Posting and cancelling movements run inside a single DB transaction:

1. validate rules
2. insert header
3. insert lines
4. update balances
5. commit

### Recalculation rule

Backend has service support to recalculate `inventory_balances` from the ledger.

Frontend implication:

- balances are materialized for read performance
- ledger remains the historical source of truth

## Common Inventory Error Catalog

### Shared inventory CRUD errors

- `ENTITY_CODE_INVALID_FORMAT`
- `ENTITY_CODE_ASSIGNMENT_CONFLICT`
- `BRAND_NOT_FOUND`
- `MEASUREMENT_UNIT_NOT_FOUND`
- `CATEGORY_NOT_FOUND`
- `TAX_PROFILE_NOT_FOUND`
- `WARRANTY_PROFILE_NOT_FOUND`
- `PRODUCT_NOT_FOUND`
- `PRICE_LIST_NOT_FOUND`
- `PRODUCT_PRICE_NOT_FOUND`
- `PROMOTION_NOT_FOUND`
- `WAREHOUSE_NOT_FOUND`
- `WAREHOUSE_LOCATION_NOT_FOUND`
- `INVENTORY_LOT_NOT_FOUND`
- `INVENTORY_MOVEMENT_NOT_FOUND`

### Duplicate and conflict errors

- `BRAND_NAME_DUPLICATE`
- `MEASUREMENT_UNIT_NAME_OR_SYMBOL_DUPLICATE`
- `CATEGORY_NAME_DUPLICATE`
- `TAX_PROFILE_NAME_DUPLICATE`
- `WARRANTY_PROFILE_NAME_DUPLICATE`
- `PRODUCT_SKU_DUPLICATE`
- `PRODUCT_BARCODE_DUPLICATE`
- `PRICE_LIST_NAME_DUPLICATE`
- `PROMOTION_NAME_DUPLICATE`
- `WAREHOUSE_NAME_DUPLICATE`
- `WAREHOUSE_LOCATION_NAME_DUPLICATE`
- `INVENTORY_LOT_NUMBER_DUPLICATE`

### Product rule errors

- `PRODUCT_TAX_PROFILE_GOODS_REQUIRED`
- `PRODUCT_TAX_PROFILE_SERVICE_REQUIRED`
- `PRODUCT_INVENTORY_TRACKING_REQUIRED`
- `PRODUCT_LOT_TRACKING_REQUIRES_INVENTORY`
- `PRODUCT_EXPIRATION_REQUIRES_LOTS`
- `PRODUCT_WARRANTY_PROFILE_REQUIRED`
- `PRODUCT_LOT_TRACKING_REQUIRED`
- `PRODUCT_UNIT_CONVERSION_NOT_SUPPORTED`

### Pricing and promotion rule errors

- `PRICE_VALID_RANGE_INVALID`
- `PROMOTION_DUPLICATE_ITEMS`
- `PROMOTION_ITEMS_OUTSIDE_BUSINESS`
- `PROMOTION_DISCOUNT_VALUE_REQUIRED`
- `PROMOTION_OVERRIDE_PRICE_REQUIRED`
- `PROMOTION_BUY_X_GET_Y_FIELDS_REQUIRED`
- `PROMOTION_DATE_RANGE_INVALID`

### Warehouse and lot rule errors

- `WAREHOUSE_LOCATIONS_DISABLED`
- `WAREHOUSE_LOCATION_MISMATCH`
- `WAREHOUSE_NOT_ALLOWED_FOR_BRANCH`
- `SUPPLIER_CONTACT_NOT_FOUND`
- `SUPPLIER_CONTACT_TYPE_INVALID`
- `INVENTORY_LOT_EXPIRATION_REQUIRED`
- `INVENTORY_LOT_REQUIRED`
- `INVENTORY_LOT_WAREHOUSE_MISMATCH`
- `INVENTORY_LOT_PRODUCT_MISMATCH`
- `INVENTORY_LOT_LOCATION_MISMATCH`
- `INVENTORY_LOT_NEGATIVE_BALANCE_FORBIDDEN`

### Ledger and movement engine errors

- `INVENTORY_ADJUSTMENT_TYPE_INVALID`
- `TENANT_MISMATCH`
- `INVENTORY_MOVEMENT_LINES_REQUIRED`
- `INVENTORY_MOVEMENT_QUANTITY_INVALID`
- `INVENTORY_BALANCE_BUCKET_NEGATIVE`
- `INSUFFICIENT_STOCK`
- `INVENTORY_NEGATIVE_STOCK_FORBIDDEN`
- `TRANSFER_WAREHOUSE_DUPLICATE`
- `TRANSFER_LINE_COUNT_INVALID`
- `TRANSFER_LINE_CONSISTENCY_INVALID`
- `INVENTORY_MOVEMENT_POSTED_REQUIRED`
- `INVENTORY_MOVEMENT_ALREADY_CANCELLED`
- `INVENTORY_MOVEMENT_RELATION_MISSING`

## Frontend Implementation Notes

### Recommended bootstrap order

1. catalogs:
   - categories
   - brands
   - measurement units
   - tax profiles
   - warranty profiles
2. products and price lists
3. product prices and promotions
4. warehouses and locations
5. warehouse stock
6. lots
7. movements

### Screen dependency notes

- product form depends on:
  - categories
  - brands
  - measurement units
  - tax profiles
  - warranty profiles
- warehouse stock grid should show both `product` and `product_variant`
- movement list actions should use `header_id` for cancellation
- transfer form depends on:
  - origin warehouse
  - destination warehouse
  - product
- lot form depends on:
  - warehouses
  - optional locations for selected warehouse
  - lot-enabled products
  - supplier contacts when exposed

### Current phase caveats

- movement responses are not fully uniform yet:
  - list is ledger-line based
  - adjust returns legacy movement row
  - transfer returns header + compact lines
  - cancel returns summary + compensating header/lines
- product maintenance is still product-master based
- variant management UI is optional for MVP because backend auto-manages one
  default variant
- warehouse `purpose` is returned but not editable yet
- pricing is still product-level, not variant-level
- `GET /inventory-movements` does not currently hydrate lot detail in each row
- `min_stock` and `max_stock` in stock rows are transitional bridge fields

### Minimal safe frontend assumptions

- authenticated inventory requests must include cookies
- every inventory query and mutation is tenant-bound server-side
- create and patch usually return the full serialized resource
- movement writes are transactional and may fail on stock or tenant rules
- no delete endpoints should be assumed for inventory core
