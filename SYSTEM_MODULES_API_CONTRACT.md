# System Modules API Contract

## Purpose

This document consolidates the current backend contract so frontend can build
against the real API instead of inferring shapes from partial screens.

It covers:

- modules currently exposed by the backend
- how the backend expects request bodies
- how it returns successful responses
- the global error envelope
- auth/session rules
- tenant mode vs platform mode vs tenant context

Important:

- controller routes are registered without a Nest global prefix
- if frontend consumes them as `/api/...`, that is a frontend proxy/base URL
  decision, not a backend route prefix
- authenticated requests use HttpOnly cookies, not bearer tokens in storage

## Global Rules

### Auth transport

- login uses `POST /auth/login`
- auth is cookie-based
- frontend must send requests with credentials
- `fetch`: `credentials: 'include'`
- `axios`: `withCredentials: true`

### Tenant and platform context

- tenant users operate with their real `business_id`
- platform admins can stay in `mode = platform`
- platform admins can enter `mode = tenant_context`
- in `tenant_context`, normal tenant endpoints can be used with the effective
  tenant determined by `acting_business_id` and optional `acting_branch_id`

### Success responses

General rule:

- `GET`, `POST`, `PATCH` usually return serialized resources
- some operational endpoints return `{ success: true }`
- context endpoints return a context response object

### Error response shape

All modules now use the same error envelope:

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "code": "USER_EMAIL_DUPLICATE",
  "messageKey": "users.email_duplicate",
  "message": "El correo electronico ya existe.",
  "details": {
    "field": "email"
  },
  "path": "/users",
  "timestamp": "2026-03-14T12:00:00.000Z",
  "requestId": "..."
}
```

Validation errors use:

```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "code": "VALIDATION_ERROR",
  "messageKey": "validation.error",
  "message": "Hay errores de validacion.",
  "details": [
    {
      "field": "email",
      "code": "VALIDATION_INVALID_EMAIL",
      "messageKey": "validation.invalid_email",
      "message": "El correo electronico no es valido."
    }
  ],
  "path": "/users",
  "timestamp": "2026-03-14T12:00:00.000Z",
  "requestId": "..."
}
```

Frontend integration rule:

- use `message` as the main error text
- use `details[].message` for field-level errors when `details` is an array
- use `code` and `messageKey` for logic, not to replace the translated text

## Enum Catalog

This section centralizes the enums currently exposed by the backend contract.

### AuthenticatedUserMode

Used by:

- `GET /auth/me`
- platform context responses

Values:

- `tenant`
- `platform`
- `tenant_context`

### IdentificationType

Used by:

- `businesses/current`
- business onboarding
- branches

Values:

- `01` = physical
- `02` = legal
- `03` = DIMEX
- `04` = NITE
- `05` = foreign

### UserStatus

Used by:

- create user
- update user status

Values:

- `active`
- `inactive`
- `suspended`
- `deleted`

### UserType

Used by:

- create user
- update user
- auth/me
- user responses

Values:

- `owner`
- `staff`
- `system`

### ContactType

Used by:

- create contact
- update contact

Values:

- `customer`
- `supplier`
- `both`

### ContactIdentificationType

Used by:

- create contact
- update contact

Values:

- `01` = physical
- `02` = legal
- `03` = DIMEX
- `04` = NITE
- `05` = foreign

### ProductType

Used by:

- create product
- update product

Values:

- `product`
- `service`

### PriceListKind

Used by:

- create price list
- update price list

Values:

- `retail`
- `wholesale`
- `credit`
- `special`

### PromotionType

Used by:

- create promotion
- update promotion

Values:

- `percentage`
- `fixed_amount`
- `buy_x_get_y`
- `price_override`

### TaxType

Used by:

- create tax profile
- update tax profile

Values:

- `iva`
- `exento`
- `no_sujeto`
- `specific_tax`

### TaxProfileItemKind

Used by:

- create tax profile
- update tax profile

Values:

- `goods`
- `service`

### WarrantyDurationUnit

Used by:

- create warranty profile
- update warranty profile

Values:

- `days`
- `months`
- `years`

### InventoryMovementType

Used by:

- inventory movement rows
- create inventory adjustment

Full enum values:

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

### PermissionKey

This is the current permission catalog used by backend guards and by frontend
for UI gating.

Auth:

- `auth.login`
- `auth.refresh`

Businesses:

- `businesses.view`
- `businesses.update`

Users:

- `users.view`
- `users.create`
- `users.update`
- `users.delete`
- `users.assign_roles`
- `users.assign_branches`
- `users.change_status`
- `users.change_password`

RBAC:

- `roles.view`
- `roles.create`
- `roles.update`
- `roles.delete`
- `roles.assign_permissions`
- `permissions.view`

Contacts:

- `contacts.view`
- `contacts.create`
- `contacts.update`

Branches and terminals:

- `branches.view`
- `branches.create`
- `branches.update`
- `branches.configure`
- `branches.create_terminal`
- `branches.update_terminal`

Inventory categories and catalogs:

- `categories.view`
- `categories.create`
- `categories.update`
- `brands.view`
- `brands.create`
- `brands.update`
- `measurement_units.view`
- `measurement_units.create`
- `measurement_units.update`
- `tax_profiles.view`
- `tax_profiles.create`
- `tax_profiles.update`
- `warranty_profiles.view`
- `warranty_profiles.create`
- `warranty_profiles.update`

Inventory products and pricing:

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

Inventory warehouses and stock:

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

## Auth Module

Exact source references:

- [auth.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/auth/controllers/auth.controller.ts)
- [login.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/auth/dto/login.dto.ts)
- [authenticated-user-context.interface.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/common/interfaces/authenticated-user-context.interface.ts)

Endpoints:

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### POST /auth/login

Body:

```json
{
  "email": "owner@empresa.com",
  "password": "Password1234"
}
```

Validation:

- `email` required, valid email
- `password` required, min length 10

Success response:

```json
{
  "user": {
    "id": 1,
    "business_id": 1,
    "active_business_language": "es-CR",
    "email": "owner@empresa.com",
    "name": "Owner",
    "roles": ["owner"],
    "permissions": ["auth.login", "auth.refresh", "users.view"],
    "branch_ids": [1, 2],
    "max_sale_discount": 100,
    "user_type": "owner",
    "is_platform_admin": false,
    "acting_business_id": null,
    "acting_branch_id": null,
    "mode": "tenant"
  }
}
```

### POST /auth/refresh

Body:

- no JSON body required
- refresh token is read from cookie

Success response:

- same contract as `login`

### POST /auth/logout

Success response:

```json
{
  "success": true
}
```

### GET /auth/me

Success response:

```json
{
  "id": 1,
  "business_id": 1,
  "active_business_language": "es-CR",
  "email": "owner@empresa.com",
  "name": "Owner",
  "roles": ["owner"],
  "permissions": ["users.view", "contacts.view"],
  "branch_ids": [1],
  "max_sale_discount": 100,
  "user_type": "owner",
  "is_platform_admin": false,
  "acting_business_id": null,
  "acting_branch_id": null,
  "mode": "tenant"
}
```

Important frontend fields:

- `active_business_language`
- `mode`
- `acting_business_id`
- `acting_branch_id`
- `permissions`

## Businesses Module

Source references:

- [businesses.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/businesses/controllers/businesses.controller.ts)
- [update-current-business.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/businesses/dto/update-current-business.dto.ts)
- [create-business-onboarding.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/businesses/dto/create-business-onboarding.dto.ts)
- [serialize-business.util.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/businesses/utils/serialize-business.util.ts)

Endpoints:

- `GET /businesses/current`
- `PATCH /businesses/current`

Permissions:

- `businesses.view`
- `businesses.update`

### GET /businesses/current

Returns:

```json
{
  "id": 1,
  "code": "BS-0001",
  "name": "FastFact",
  "legal_name": "FastFact S.A.",
  "identification_type": "02",
  "identification_number": "3101123456",
  "currency_code": "CRC",
  "timezone": "America/Costa_Rica",
  "language": "es-CR",
  "email": "empresa@fastfact.com",
  "phone": "2222-3333",
  "website": null,
  "logo_url": null,
  "country": "Costa Rica",
  "province": "San Jose",
  "canton": "Escazu",
  "district": "San Rafael",
  "city": "Escazu",
  "address": "Frente al parque",
  "postal_code": "10201",
  "is_active": true,
  "created_at": "...",
  "updated_at": "..."
}
```

### PATCH /businesses/current

Body is partial. Main fields:

- `code?`
- `name?`
- `legal_name?`
- `identification_type?`
- `identification_number?`
- `currency_code?`
- `timezone?`
- `language?`
- `email?`
- `phone?`
- `website?`
- `logo_url?`
- `country?`
- `province?`
- `canton?`
- `district?`
- `city?`
- `address?`
- `postal_code?`
- `is_active?`

Success response:

- same serializer as `GET /businesses/current`

## Platform Module

Source references:

- [platform-businesses.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/platform/controllers/platform-businesses.controller.ts)
- [platform-context.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/platform/controllers/platform-context.controller.ts)
- [enter-business-context.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/platform/dto/enter-business-context.dto.ts)
- [PLATFORM_SUPERADMIN_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/PLATFORM_SUPERADMIN_ARCHITECTURE.md)
- [TENANT_CONTEXT_SWITCHING_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/TENANT_CONTEXT_SWITCHING_ARCHITECTURE.md)

Endpoints:

- `GET /platform/businesses`
- `GET /platform/businesses/:id`
- `GET /platform/businesses/:id/branches`
- `POST /platform/businesses/onboarding`
- `POST /platform/enter-business-context`
- `POST /platform/clear-business-context`

Access:

- only platform admins

### GET /platform/businesses

Returns:

- array of business serializer objects

### GET /platform/businesses/:id

Returns:

- one business serializer object

### GET /platform/businesses/:id/branches

Returns:

- array of branch serializer objects

### POST /platform/businesses/onboarding

Body:

- exact same contract as business onboarding DTO

High-level shape:

```json
{
  "business": {
    "name": "Empresa",
    "legal_name": "Empresa S.A.",
    "identification_type": "02",
    "identification_number": "3101123456",
    "currency_code": "CRC",
    "timezone": "America/Costa_Rica",
    "language": "es-CR",
    "country": "Costa Rica",
    "province": "San Jose",
    "canton": "Escazu",
    "district": "San Rafael",
    "address": "Frente al parque"
  },
  "owner": {
    "owner_name": "Israel",
    "owner_last_name": "Rodriguez",
    "owner_email": "owner@empresa.com",
    "owner_password": "ClaveSegura123!"
  },
  "initial_branch": {
    "branch_name": "Escazu",
    "branch_number": "001",
    "branch_identification_type": "02",
    "branch_identification_number": "3101123456",
    "branch_address": "100m sur del parque",
    "branch_province": "San Jose",
    "branch_canton": "Escazu",
    "branch_district": "San Rafael"
  },
  "initial_terminal": {
    "create_initial_terminal": true,
    "terminal_name": "Caja 1",
    "terminal_number": "00001"
  }
}
```

Success response:

```json
{
  "business": { "...": "business serializer" },
  "owner": { "...": "owner serializer" },
  "initial_branch": { "...": "branch serializer" },
  "initial_terminal": { "...": "terminal serializer or null" },
  "onboarding_ready": true
}
```

### POST /platform/enter-business-context

Body:

```json
{
  "business_id": 7,
  "branch_id": 12
}
```

`branch_id` is optional.

Success response:

```json
{
  "success": true,
  "mode": "tenant_context",
  "business_id": 1,
  "acting_business_id": 7,
  "acting_branch_id": 12,
  "is_platform_admin": true,
  "platform_ready": true,
  "tenant_context_active": true
}
```

### POST /platform/clear-business-context

Success response:

```json
{
  "success": true,
  "mode": "platform",
  "business_id": 1,
  "acting_business_id": null,
  "acting_branch_id": null,
  "is_platform_admin": true,
  "platform_ready": true,
  "tenant_context_active": false
}
```

## Users Module

Source references:

- [users.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/controllers/users.controller.ts)
- [create-user.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/dto/create-user.dto.ts)
- [update-user.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/dto/update-user.dto.ts)
- [update-user-status.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/dto/update-user-status.dto.ts)
- [update-user-password.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/dto/update-user-password.dto.ts)
- [assign-user-roles.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/dto/assign-user-roles.dto.ts)
- [assign-user-branches.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/users/dto/assign-user-branches.dto.ts)

Endpoints:

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `PATCH /users/:id/status`
- `PATCH /users/:id/password`
- `PUT /users/:id/roles`
- `PUT /users/:id/branches`
- `GET /users/:id/effective-permissions`

Permissions:

- `users.view`
- `users.create`
- `users.update`
- `users.change_status`
- `users.change_password`
- `users.assign_roles`
- `users.assign_branches`

Main enums:

- `status`: `active | inactive | suspended | deleted`
- `user_type`: `owner | staff | system`

Create body:

```json
{
  "code": "US-0009",
  "name": "Cajero Principal",
  "email": "cajero@empresa.com",
  "password": "Password1234",
  "status": "active",
  "allow_login": true,
  "user_type": "staff",
  "max_sale_discount": 10,
  "role_ids": [1, 2],
  "branch_ids": [1, 3]
}
```

Update body is partial and does not include password.

Status body:

```json
{
  "status": "inactive",
  "allow_login": false
}
```

Password body:

```json
{
  "password": "NewPassword1234"
}
```

Assign roles:

```json
{
  "role_ids": [1, 2]
}
```

Assign branches:

```json
{
  "branch_ids": [1, 3]
}
```

Serialized user response:

```json
{
  "id": 1,
  "code": "US-0009",
  "business_id": 1,
  "name": "Cajero Principal",
  "email": "cajero@empresa.com",
  "status": "active",
  "allow_login": true,
  "user_type": "staff",
  "is_platform_admin": false,
  "max_sale_discount": 10,
  "last_login_at": null,
  "created_at": "...",
  "updated_at": "...",
  "roles": [
    {
      "id": 1,
      "code": "RL-0001",
      "name": "Admin",
      "role_key": "admin",
      "is_system": false
    }
  ],
  "branch_ids": [1, 3],
  "branches": [
    {
      "id": 1,
      "code": "BR-0001",
      "branch_number": "001",
      "business_name": "FastFact Escazu"
    }
  ],
  "effective_permissions": ["users.view", "contacts.view"]
}
```

`GET /users/:id/effective-permissions` returns the authenticated-context shape
of that user.

## RBAC Module

Source references:

- [roles.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/rbac/controllers/roles.controller.ts)
- [permissions.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/rbac/controllers/permissions.controller.ts)
- [create-role.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/rbac/dto/create-role.dto.ts)
- [update-role.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/rbac/dto/update-role.dto.ts)
- [assign-role-permissions.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/rbac/dto/assign-role-permissions.dto.ts)

Endpoints:

- `GET /roles`
- `POST /roles`
- `PATCH /roles/:id`
- `DELETE /roles/:id`
- `PUT /roles/:id/permissions`
- `GET /permissions`

Permissions:

- `roles.view`
- `roles.create`
- `roles.update`
- `roles.delete`
- `roles.assign_permissions`
- `permissions.view`

Role create/update body:

- `code?`
- `name`
- `role_key`

Assign permissions body:

```json
{
  "permission_ids": [1, 2, 3]
}
```

Role response:

```json
{
  "id": 1,
  "code": "RL-0007",
  "business_id": 1,
  "name": "Administrador",
  "role_key": "admin",
  "is_system": false,
  "created_at": "...",
  "updated_at": "...",
  "permissions": [
    {
      "id": 1,
      "key": "users.view"
    }
  ]
}
```

Delete response:

```json
{
  "success": true
}
```

`GET /permissions` returns the global permission catalog.

Permission catalog row:

```json
{
  "id": 1,
  "code": "PM-0001",
  "key": "users.view",
  "module": "users",
  "action": "view",
  "description": "Ver usuarios"
}
```

## Branches and Terminals Module

Source references:

- [branches.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/controllers/branches.controller.ts)
- [terminals.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/controllers/terminals.controller.ts)
- [create-branch.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/dto/create-branch.dto.ts)
- [update-branch.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/dto/update-branch.dto.ts)
- [create-terminal.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/dto/create-terminal.dto.ts)
- [update-terminal.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/dto/update-terminal.dto.ts)
- [serialize-branch.util.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/branches/utils/serialize-branch.util.ts)

Endpoints:

- `GET /branches`
- `POST /branches`
- `GET /branches/:id`
- `PATCH /branches/:id`
- `POST /branches/:id/terminals`
- `PATCH /terminals/:id`

Permissions:

- `branches.view`
- `branches.create`
- `branches.update`
- `branches.create_terminal`
- `branches.update_terminal`
- `branches.configure` for sensitive branch config fields

Branch create body:

- `code?`
- `business_name`
- `name?`
- `legal_name`
- `identification_type?`
- `identification_number?`
- `cedula_juridica`
- `branch_number`
- `address`
- `province`
- `canton`
- `district`
- `city?`
- `phone?`
- `email?`
- `activity_code?`
- `provider_code?`
- `cert_path?`
- `crypto_key?`
- `hacienda_username?`
- `hacienda_password?`
- `mail_key?`
- `signature_type?`
- `is_active?`

Terminal create body:

```json
{
  "code": "TR-0001",
  "terminal_number": "00001",
  "name": "Caja 1",
  "is_active": true
}
```

Branch response:

```json
{
  "id": 1,
  "code": "BR-0001",
  "business_id": 1,
  "business_name": "FastFact Escazu",
  "name": "Escazu",
  "legal_name": "FastFact S.A.",
  "identification_type": "02",
  "identification_number": "3101123456",
  "cedula_juridica": "3101123456",
  "branch_number": "001",
  "address": "Centro Comercial Plaza, Local 5",
  "province": "San Jose",
  "canton": "Escazu",
  "district": "San Rafael",
  "city": "Escazu",
  "phone": "2222-3333",
  "email": "sucursal@empresa.com",
  "activity_code": "123456",
  "provider_code": "PROV-01",
  "cert_path": "C:/certs/sucursal.p12",
  "hacienda_username": "usuario_hacienda",
  "signature_type": "p12",
  "is_active": true,
  "has_crypto_key": true,
  "has_hacienda_password": true,
  "has_mail_key": true,
  "created_at": "...",
  "updated_at": "...",
  "terminals": [
    {
      "id": 1,
      "code": "TR-0001",
      "branch_id": 1,
      "terminal_number": "00001",
      "name": "Caja 1",
      "is_active": true,
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

Terminal patch returns the terminal serializer.

## Contacts Module

Source references:

- [contacts.controller.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/contacts/controllers/contacts.controller.ts)
- [create-contact.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/contacts/dto/create-contact.dto.ts)
- [update-contact.dto.ts](c:/Users/cente/OneDrive/Documentos/fastfact/api/src/modules/contacts/dto/update-contact.dto.ts)

Endpoints:

- `GET /contacts`
- `POST /contacts`
- `GET /contacts/lookup/:identification`
- `GET /contacts/:id`
- `PATCH /contacts/:id`

Permissions:

- `contacts.view`
- `contacts.create`
- `contacts.update`

Enums:

- `type`: `customer | supplier | both`
- `identification_type`: `01 | 02 | 03 | 04 | 05`

Create body:

```json
{
  "code": "CT-0001",
  "type": "customer",
  "name": "Cliente de Mostrador",
  "commercial_name": "FastFact Comercial",
  "identification_type": "02",
  "identification_number": "3101123456",
  "email": "cliente@empresa.com",
  "phone": "8888-9999",
  "address": "San Jose, Escazu, San Rafael",
  "province": "San Jose",
  "canton": "Escazu",
  "district": "San Rafael",
  "tax_condition": "general",
  "economic_activity_code": "621100",
  "is_active": true,
  "exoneration_type": "purchase",
  "exoneration_document_number": "EXO-2026-0001",
  "exoneration_institution": "Ministerio de Hacienda",
  "exoneration_issue_date": "2026-03-10",
  "exoneration_percentage": 50
}
```

Update body is partial with the same field names.

Response:

```json
{
  "id": 1,
  "code": "CT-0001",
  "business_id": 1,
  "type": "customer",
  "name": "Cliente de Mostrador",
  "commercial_name": "FastFact Comercial",
  "identification_type": "02",
  "identification_number": "3101123456",
  "email": "cliente@empresa.com",
  "phone": "8888-9999",
  "address": "San Jose, Escazu, San Rafael",
  "province": "San Jose",
  "canton": "Escazu",
  "district": "San Rafael",
  "tax_condition": "general",
  "economic_activity_code": "621100",
  "is_active": true,
  "exoneration_type": "purchase",
  "exoneration_document_number": "EXO-2026-0001",
  "exoneration_institution": "Ministerio de Hacienda",
  "exoneration_issue_date": "2026-03-10T00:00:00.000Z",
  "exoneration_percentage": 50,
  "created_at": "...",
  "updated_at": "..."
}
```

## Inventory Module

Inventory is grouped into three families.

Dedicated inventory integration document:

- [INVENTORY_FRONTEND_API_CONTRACT.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/INVENTORY_FRONTEND_API_CONTRACT.md)

Important:

- all inventory endpoints are tenant-aware
- in `tenant_context`, platform admins can use them like a tenant user
- all inventory errors use the same global envelope

Main inventory permissions:

- `categories.*`
- `brands.*`
- `measurement_units.*`
- `tax_profiles.*`
- `products.*`
- `price_lists.*`
- `product_prices.*`
- `warranty_profiles.*`
- `promotions.*`
- `warehouses.*`
- `warehouse_locations.*`
- `warehouse_stock.view`
- `inventory_lots.*`
- `inventory_movements.view`
- `inventory_movements.adjust`

### Inventory Catalogs

Endpoints:

- `GET|POST|GET:id|PATCH:id /brands`
- `GET|POST|GET:id|PATCH:id /measurement-units`
- `GET|POST|GET:id|PATCH:id /tax-profiles`
- `GET|POST|GET:id|PATCH:id /warranty-profiles`
- `GET|POST|GET:id|PATCH:id /product-categories`
- `GET /product-categories/tree`

Main create/update contracts:

- Brands:
  - `code?`
  - `name`
  - `description?`
  - `is_active?`
- Measurement units:
  - `code?`
  - `name`
  - `symbol`
  - `is_active?`
- Tax profiles:
  - `code?`
  - `name`
  - `description?`
  - `cabys_code`
  - `item_kind`
  - `tax_type`
  - `iva_rate_code?`
  - `iva_rate?`
  - `requires_cabys?`
  - `allows_exoneration?`
  - `has_specific_tax?`
  - `specific_tax_name?`
  - `specific_tax_rate?`
  - `is_active?`
- Warranty profiles:
  - `code?`
  - `name`
  - `duration_value`
  - `duration_unit`
  - `coverage_notes?`
  - `is_active?`
- Product categories:
  - `code?`
  - `name`
  - `description?`
  - `parent_id?`
  - `is_active?`

Main enums:

- `item_kind`: `goods | service`
- `tax_type`: `iva | exento | no_sujeto | specific_tax`
- `duration_unit`: `days | months | years`

Responses:

- `POST` and `PATCH` return the same serialized shape as `GET :id`
- catalog serializers return ids, codes, business_id, business fields, state
  flags and timestamps

### Products, Price Lists, Product Prices and Promotions

Endpoints:

- `GET|POST|GET:id|PATCH:id /products`
- `GET /products/:id/prices`
- `POST /products/:id/prices`
- `PATCH /product-prices/:id`
- `GET|POST|GET:id|PATCH:id /price-lists`
- `GET|POST|GET:id|PATCH:id /promotions`

Products body:

- `code?`
- `type`
- `name`
- `description?`
- `category_id?`
- `brand_id?`
- `sku?`
- `barcode?`
- `stock_unit_id?`
- `sale_unit_id?`
- `tax_profile_id`
- `track_inventory?`
- `track_lots?`
- `track_expiration?`
- `allow_negative_stock?`
- `has_warranty?`
- `warranty_profile_id?`
- `is_active?`

Price list body:

- `code?`
- `name`
- `kind`
- `currency`
- `is_default?`
- `is_active?`

Product price body:

- `price_list_id`
- `price`
- `min_quantity?`
- `valid_from?`
- `valid_to?`
- `is_active?`

Promotion body:

- `code?`
- `name`
- `type`
- `valid_from`
- `valid_to`
- `is_active?`
- `items?`

Promotion item body:

- `product_id`
- `min_quantity?`
- `discount_value?`
- `override_price?`
- `bonus_quantity?`

Main enums:

- `product.type`: `product | service`
- `price_list.kind`: `retail | wholesale | credit | special`
- `promotion.type`: `percentage | fixed_amount | buy_x_get_y | price_override`

Responses:

- `POST` and `PATCH` return the full serialized resource
- `GET /products/:id/prices` returns product price rows for that product
- `POST /products/:id/prices` returns the created product price row

### Warehouses, Stock, Lots and Movements

Endpoints:

- `GET|POST|GET:id|PATCH:id /warehouses`
- `GET /warehouses/:id/locations`
- `POST /warehouses/:id/locations`
- `GET /warehouse-locations/:id`
- `PATCH /warehouse-locations/:id`
- `GET /warehouse-stock`
- `GET /warehouse-stock/:warehouseId/products`
- `GET|POST|GET:id|PATCH:id /inventory-lots`
- `GET /inventory-movements`
- `POST /inventory-movements/adjust`

Warehouse body:

- `code?`
- `branch_id`
- `name`
- `description?`
- `uses_locations?`
- `is_default?`
- `is_active?`

Warehouse location body:

- `code?`
- `name`
- `description?`
- `zone?`
- `aisle?`
- `rack?`
- `level?`
- `position?`
- `barcode?`
- `is_picking_area?`
- `is_receiving_area?`
- `is_dispatch_area?`
- `is_active?`

Inventory lot body:

- `code?`
- `warehouse_id`
- `location_id?`
- `product_id`
- `lot_number`
- `expiration_date?`
- `manufacturing_date?`
- `received_at?`
- `initial_quantity`
- `unit_cost?`
- `supplier_contact_id?`
- `is_active?`

Inventory adjustment body:

- `warehouse_id`
- `location_id?`
- `product_id`
- `inventory_lot_id?`
- `movement_type`
- `quantity`
- `reference_type?`
- `reference_id?`
- `notes?`

Adjustment enum supported by this endpoint:

- `adjustment_in`
- `adjustment_out`

Responses:

- warehouse serializers include location arrays where applicable
- warehouse stock endpoints return stock rows by warehouse/product
- lot serializers return lot detail including balances, warehouse and product
  references
- movement list returns serialized movement rows

## Common Module Error and Validation Contract

Source references:

- [ERROR_HANDLING_I18N_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/ERROR_HANDLING_I18N_ARCHITECTURE.md)
- [ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md)

Language resolution for backend errors:

- active business language first
- then `Accept-Language`
- then fallback `es`

That means:

- tenant user -> business language of the active tenant
- platform admin in tenant context -> acting business language
- platform admin in platform mode -> header language or `es`

## Frontend Validation Checklist

Use frontend validation to block syntactically invalid requests before they hit
the backend, but keep these boundaries clear:

- frontend validates shape, required fields, enums, ranges, regex and obvious
  cross-field dependencies
- backend remains the source of truth for permissions, tenant scope, relation
  ownership, uniqueness, existence checks and business rules that depend on DB

### Shared form hygiene rules

- submit exact DTO field names as documented in this file
- for optional text fields, prefer omitting the field instead of sending `""`
- for optional dates, send ISO strings or omit the field
- for optional numeric fields, send a number or omit the field
- for id arrays, remove duplicates before submit
- do not send `business_id`, `acting_business_id` or `acting_branch_id` in
  tenant CRUD payloads

### Shared regex patterns

These patterns are already enforced by backend DTOs and validators:

- generic entity code: `^[A-Z]{2}-\\d{4,}$`
- role key: `^[a-z][a-z0-9_]*$`
- branch number: `^\\d{3}$`
- terminal number: `^\\d{5}$`
- numeric string: `^\\d+$`
- 3-letter uppercase currency code: `^[A-Z]{3}$`

### Auth

- `POST /auth/login`
  - `email` required and valid email
  - `password` required and minimum 10 characters

### Businesses current

- `PATCH /businesses/current`
  - `code` optional, matches generic entity code
  - `name` optional, minimum 2 characters
  - `legal_name` optional, minimum 2 characters
  - `identification_type` optional enum: `01 | 02 | 03 | 04 | 05`
  - `identification_number` optional, minimum 2 characters
  - `currency_code` optional, exactly 3 uppercase letters
  - `timezone` optional, minimum 2 characters
  - `language` optional, minimum 2 characters
  - `email` optional, valid email
  - `address` optional, minimum 5 characters
  - `postal_code` optional, numeric string only
  - `is_active` optional boolean

### Platform context and onboarding

- `POST /platform/enter-business-context`
  - `business_id` required, positive integer
  - `branch_id` optional, positive integer
- `POST /platform/businesses/onboarding`
  - `business.name`, `business.legal_name`, `business.country`,
    `business.province`, `business.canton`, `business.district` required,
    minimum 2 characters
  - `business.identification_type` required enum
  - `business.identification_number` required, minimum 2 characters
  - `business.currency_code` required, exactly 3 uppercase letters
  - `business.timezone` required, minimum 2 characters
  - `business.language` required, minimum 2 characters
  - `business.email` optional, valid email
  - `business.address` required, minimum 5 characters
  - `business.postal_code` optional, numeric string only
  - `owner.owner_name`, `owner.owner_last_name` required, minimum 2 characters
  - `owner.owner_email` required, valid email
  - `owner.owner_password` required, minimum 10 characters
  - `initial_branch.branch_name`, `branch_address`, `branch_province`,
    `branch_canton`, `branch_district` required, minimum 2 or 5 depending on
    field:
    - `branch_address` minimum 5
    - other branch text fields minimum 2
  - `initial_branch.branch_number` required, exactly 3 digits
  - `initial_branch.branch_identification_type` required enum
  - `initial_branch.branch_identification_number` required, minimum 2
  - `initial_branch.branch_email` optional, valid email
  - `initial_terminal.create_initial_terminal` required boolean
  - if `create_initial_terminal = true`:
    - `terminal_name` required, minimum 2 characters
    - `terminal_number` required, exactly 5 digits

### Users

- `POST /users`
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `email` required, valid email
  - `password` required, minimum 10 characters
  - `status` optional enum: `active | inactive | suspended | deleted`
  - `allow_login` optional boolean
  - `user_type` optional enum: `owner | staff | system`
  - `max_sale_discount` optional number between `0` and `100`
  - `role_ids` optional array of unique integers
  - `branch_ids` optional array of unique integers
- `PATCH /users/:id`
  - same rules as create, except `password` is not part of this payload
- `PATCH /users/:id/status`
  - `status` required enum
  - `allow_login` optional boolean
- `PATCH /users/:id/password`
  - `password` required, minimum 10 characters
- `PUT /users/:id/roles`
  - `role_ids` required array of unique integers
- `PUT /users/:id/branches`
  - `branch_ids` required array of unique integers

### Contacts

- `POST /contacts`
  - `code` optional, matches generic entity code
  - `type` required enum: `customer | supplier | both`
  - `name` required, minimum 2 characters
  - `commercial_name` optional, minimum 2 characters
  - `identification_type` required enum: `01 | 02 | 03 | 04 | 05`
  - `identification_number` required, minimum 2 characters
  - `email` optional, valid email
  - `phone` optional string
  - `address` optional, minimum 5 characters
  - `province`, `canton`, `district`, `tax_condition`,
    `economic_activity_code`, `exoneration_type`,
    `exoneration_document_number`, `exoneration_institution` optional strings
  - `is_active` optional boolean
  - `exoneration_issue_date` optional ISO date
  - `exoneration_percentage` optional number between `0` and `100`
- `PATCH /contacts/:id`
  - same field rules as create, but every field is optional

### RBAC

- `POST /roles`
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `role_key` required, matches `^[a-z][a-z0-9_]*$`
- `PATCH /roles/:id`
  - same rules as create, but all fields optional
- `PUT /roles/:id/permissions`
  - `permission_ids` required array of unique integers

### Branches and terminals

- `POST /branches`
  - `code` optional, matches generic entity code
  - `business_name` required, minimum 2 characters
  - `name` optional, minimum 2 characters
  - `legal_name` required, minimum 2 characters
  - `identification_type` optional enum: `01 | 02 | 03 | 04 | 05`
  - `identification_number` optional, minimum 2 characters
  - `cedula_juridica` required numeric string
  - `branch_number` required, exactly 3 digits
  - `address` required, minimum 5 characters
  - `province`, `canton`, `district` required strings
  - `city`, `phone`, `activity_code`, `provider_code`, `cert_path`,
    `crypto_key`, `hacienda_username`, `hacienda_password`, `mail_key`,
    `signature_type` optional strings
  - `email` optional, valid email
  - `is_active` optional boolean
- `PATCH /branches/:id`
  - same field rules as create, but fields are optional according to the DTO
- `POST /branches/:id/terminals`
  - `code` optional, matches generic entity code
  - `terminal_number` required, exactly 5 digits
  - `name` required, minimum 2 characters
  - `is_active` optional boolean
- `PATCH /terminals/:id`
  - same field rules as create terminal, but optional

### Inventory catalogs

- brands
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `description` optional string
  - `is_active` optional boolean
- measurement units
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `symbol` required, minimum 1 character
  - `is_active` optional boolean
- product categories
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `description` optional string
  - `parent_id` optional integer
  - `is_active` optional boolean
- tax profiles
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `description` optional string
  - `cabys_code` required numeric string
  - `item_kind` required enum: `goods | service`
  - `tax_type` required enum: `iva | exento | no_sujeto | specific_tax`
  - `iva_rate_code` optional string
  - `iva_rate` optional number between `0` and `100`, max 4 decimals
  - `requires_cabys`, `allows_exoneration`, `has_specific_tax`, `is_active`
    optional booleans
  - `specific_tax_name` optional string
  - `specific_tax_rate` optional number `>= 0`, max 4 decimals
- warranty profiles
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `duration_value` required integer `>= 1`
  - `duration_unit` required enum: `days | months | years`
  - `coverage_notes` optional string
  - `is_active` optional boolean

### Inventory products, pricing and promotions

- products
  - `code` optional, matches generic entity code
  - `type` required enum: `product | service`
  - `name` required, minimum 2 characters
  - `description`, `sku`, `barcode` optional strings
  - `category_id`, `brand_id`, `stock_unit_id`, `sale_unit_id`,
    `warranty_profile_id` optional integers
  - `tax_profile_id` required integer
  - `track_inventory`, `track_lots`, `track_expiration`,
    `allow_negative_stock`, `has_warranty`, `is_active` optional booleans
  - recommended UI dependency:
    - if `has_warranty = true`, require `warranty_profile_id`
    - if `track_expiration = true`, require `track_lots = true`
    - if `track_lots = true`, require `track_inventory = true`
- price lists
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `kind` required enum: `retail | wholesale | credit | special`
  - `currency` required, exactly 3 uppercase letters
  - `is_default`, `is_active` optional booleans
- product prices
  - `price_list_id` required integer
  - `price` required number `>= 0`, max 4 decimals
  - `min_quantity` optional number `>= 0`, max 4 decimals
  - `valid_from`, `valid_to` optional ISO dates
  - `is_active` optional boolean
  - recommended UI dependency:
    - if both are present, enforce `valid_to >= valid_from`
- promotions
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `type` required enum:
    `percentage | fixed_amount | buy_x_get_y | price_override`
  - `valid_from`, `valid_to` required ISO dates
  - `is_active` optional boolean
  - `items` optional array of nested promotion items
  - recommended UI dependency:
    - enforce `valid_to >= valid_from`
- promotion items
  - `product_id` required integer
  - `min_quantity`, `discount_value`, `override_price`, `bonus_quantity`
    optional numbers `>= 0`, max 4 decimals
  - recommended UI dependency:
    - require at least one business-relevant numeric field for the selected
      promotion type instead of allowing a visually empty item row

### Inventory warehouses, locations, lots and adjustments

- warehouses
  - `code` optional, matches generic entity code
  - `branch_id` required integer
  - `name` required, minimum 2 characters
  - `description` optional string
  - `uses_locations`, `is_default`, `is_active` optional booleans
- warehouse locations
  - `code` optional, matches generic entity code
  - `name` required, minimum 2 characters
  - `description`, `zone`, `aisle`, `rack`, `level`, `position`, `barcode`
    optional strings
  - `is_picking_area`, `is_receiving_area`, `is_dispatch_area`, `is_active`
    optional booleans
- inventory lots
  - `code` optional, matches generic entity code
  - `warehouse_id` required integer
  - `location_id` optional integer
  - `product_id` required integer
  - `lot_number` required, minimum 2 characters
  - `expiration_date`, `manufacturing_date`, `received_at` optional ISO dates
  - `initial_quantity` required number `>= 0`, max 4 decimals
  - `unit_cost` optional number `>= 0`, max 4 decimals
  - `supplier_contact_id` optional integer
  - `is_active` optional boolean
  - recommended UI dependency:
    - if both are present, keep `expiration_date >= manufacturing_date`
- inventory adjustments
  - `warehouse_id` required integer
  - `location_id` optional integer
  - `product_id` required integer
  - `inventory_lot_id` optional integer
  - `movement_type` required enum, but this endpoint should only expose:
    `adjustment_in | adjustment_out`
  - `quantity` required number `>= 0.0001`, max 4 decimals
  - `reference_type` optional string
  - `reference_id` optional integer
  - `notes` optional string

## Frontend Integration Notes

What frontend should assume now:

- `users` and `contacts` are not special anymore; the same error contract applies
  to every module
- do not maintain custom ad hoc error mappers per module if backend already
  sends `message`
- for all create/update screens:
  - submit exact DTO field names
  - if create succeeds, backend usually returns the created resource
  - if patch succeeds, backend usually returns the updated resource
- for deletes or operational actions:
  - expect `{ success: true }` or a context response
- use `auth/me.active_business_language` to align frontend success-message i18n

## Recommended Frontend Priority

1. finish adapting `auth/me`, global error parsing and language handling
2. adapt `branches`, `rbac` and `businesses/current`
3. adapt `inventory` by family:
   - catalogs
   - products and pricing
   - warehouses and stock
4. reuse one shared API error parser across all modules
