# Frontend Backend Alignment Prompt

## Purpose

This document gives frontend a ready-to-use Codex prompt to align the current
UI with the real backend contract defined in:

- [SYSTEM_MODULES_API_CONTRACT.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/SYSTEM_MODULES_API_CONTRACT.md)
- [ERROR_HANDLING_I18N_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/ERROR_HANDLING_I18N_ARCHITECTURE.md)
- [ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md](c:/Users/cente/OneDrive/Documentos/fastfact/api/ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md)

Use this prompt as the base instruction for Codex in the frontend repository.

## Ready-To-Paste Prompt

```text
Quiero que adaptes el frontend actual al contrato real del backend FastFact.

Trabaja con criterio de arquitecto senior frontend para SaaS empresariales.
No quiero hacks.
No quiero lógica duplicada por módulo.
No quiero mappers ad hoc distintos para cada pantalla.
No quiero que el frontend invente mensajes de error cuando el backend ya los devuelve.

La fuente de verdad del backend está en estos documentos:
- SYSTEM_MODULES_API_CONTRACT.md
- ERROR_HANDLING_I18N_ARCHITECTURE.md
- ERROR_LANGUAGE_PRIORITY_ARCHITECTURE.md

Objetivo:
dejar el frontend alineado con el backend actual para:
- auth y contexto operativo
- manejo global de errores
- idioma efectivo
- validaciones frontend para reducir requests inválidas
- users
- contacts
- businesses/current
- branches
- terminals
- rbac
- inventory

==================================================
1. REGLAS GLOBALES QUE DEBES RESPETAR
==================================================

1. El backend usa cookies HttpOnly.
Todas las requests autenticadas deben ir con credentials.

- fetch: credentials: 'include'
- axios: withCredentials: true

2. El backend no usa bearer token en localStorage para la sesión normal.

3. La fuente de verdad del contexto del usuario es:
- GET /auth/me

Usa esa respuesta para obtener:
- mode
- business_id
- acting_business_id
- acting_branch_id
- permissions
- active_business_language
- is_platform_admin

4. No dupliques pantallas solo porque cambie el contexto.
Si cambia el modo:
- mode = tenant
- mode = tenant_context
- mode = platform

reutiliza la misma capa de datos y decide rutas/endpoints según el modo.

5. El backend ya devuelve errores traducidos.
No sobrescribas esos textos con mappers locales en inglés o español.

==================================================
2. MANEJO GLOBAL DE ERRORES
==================================================

Implementa un parser global de errores de API reutilizable para toda la app.

El shape esperado del backend es:
{
  statusCode,
  error,
  code,
  messageKey,
  message,
  details,
  path,
  timestamp,
  requestId
}

Reglas:
- usa response.message como texto principal del error
- si details es array, usa details[].message para errores de campo
- usa code y messageKey para lógica, no para reemplazar el texto humano
- si el backend ya trae message, no inventes traducción local
- si el backend no trae message por algún caso extremo, usa un fallback genérico del frontend

Quiero una sola utilidad compartida para:
- normalizar errores HTTP
- extraer field errors
- exponer requestId para soporte/debug

==================================================
3. IDIOMA EFECTIVO
==================================================

El backend ya traduce errores con prioridad:
1. active business language
2. Accept-Language
3. es

El frontend debe alinear sus mensajes de éxito y textos operativos al mismo idioma efectivo.

Reglas:
- toma active_business_language desde GET /auth/me
- úsalo como idioma de UI para mensajes de éxito ligados al negocio activo
- no hagas que el idioma del navegador pise el idioma de la empresa activa
- no toques backend

==================================================
4. VALIDACIONES FRONTEND
==================================================

Implementa validaciones frontend para cortar requests inválidas, pero sin mover reglas de negocio al cliente.

Sí validar en frontend:
- required
- email
- enum
- min/max
- regex
- longitud exacta
- arrays únicos
- fechas válidas
- dependencias obvias entre campos

No reemplazar backend en:
- unicidad real
- permisos
- tenant scope
- ownership de relaciones
- existencia real en DB

Patterns globales:
- generic entity code: ^[A-Z]{2}-\\d{4,}$
- role key: ^[a-z][a-z0-9_]*$
- branch number: ^\\d{3}$
- terminal number: ^\\d{5}$
- numeric string: ^\\d+$
- currency code: ^[A-Z]{3}$

==================================================
5. MÓDULOS A ADAPTAR
==================================================

### Auth

- integrar GET /auth/me como bootstrap de contexto
- persistir el contexto en un store compartido
- exponer:
  - mode
  - active_business_language
  - permissions
  - acting_business_id
  - acting_branch_id

### Users

Payload create:
- code?
- name
- email
- password
- status?
- allow_login?
- user_type?
- max_sale_discount?
- role_ids?
- branch_ids?

Validaciones frontend:
- code opcional con generic entity code
- name mínimo 2
- email válido
- password mínimo 10
- status enum
- user_type enum
- max_sale_discount entre 0 y 100
- role_ids y branch_ids arrays de enteros únicos

### Contacts

Payload create:
- code?
- type
- name
- commercial_name?
- identification_type
- identification_number
- email?
- phone?
- address?
- province?
- canton?
- district?
- tax_condition?
- economic_activity_code?
- is_active?
- exoneration_type?
- exoneration_document_number?
- exoneration_institution?
- exoneration_issue_date?
- exoneration_percentage?

Validaciones frontend:
- type requerido enum customer|supplier|both
- name mínimo 2
- commercial_name mínimo 2 si viene
- identification_type requerido enum 01|02|03|04|05
- identification_number mínimo 2
- email válido si viene
- address mínimo 5 si viene
- is_active boolean
- exoneration_issue_date fecha ISO si viene
- exoneration_percentage entre 0 y 100 si viene

### Businesses/current

Validaciones frontend:
- code opcional con generic entity code
- name y legal_name mínimo 2 si vienen
- identification_type enum si viene
- identification_number mínimo 2 si viene
- currency_code exactamente 3 letras mayúsculas si viene
- timezone mínimo 2 si viene
- language mínimo 2 si viene
- email válido si viene
- address mínimo 5 si viene
- postal_code solo dígitos si viene
- is_active boolean si viene

### Branches

Validaciones frontend:
- code opcional con generic entity code
- business_name requerido mínimo 2
- name mínimo 2 si viene
- legal_name requerido mínimo 2
- identification_type enum si viene
- identification_number mínimo 2 si viene
- cedula_juridica requerida numérica
- branch_number requerido exactamente 3 dígitos
- address requerido mínimo 5
- province, canton, district requeridos
- email válido si viene
- is_active boolean si viene

### Terminals

Validaciones frontend:
- code opcional con generic entity code
- terminal_number requerido exactamente 5 dígitos
- name requerido mínimo 2
- is_active boolean si viene

### RBAC

Roles:
- code opcional con generic entity code
- name requerido mínimo 2
- role_key requerido con pattern ^[a-z][a-z0-9_]*$

Assign permissions:
- permission_ids array requerido de enteros únicos

### Inventory

Catalogs:
- brands: name mínimo 2
- measurement_units: name mínimo 2, symbol mínimo 1
- product_categories: name mínimo 2
- tax_profiles:
  - name mínimo 2
  - cabys_code numérico
  - item_kind enum goods|service
  - tax_type enum iva|exento|no_sujeto|specific_tax
  - iva_rate entre 0 y 100 si viene
  - specific_tax_rate >= 0 si viene
- warranty_profiles:
  - name mínimo 2
  - duration_value entero >= 1
  - duration_unit enum days|months|years

Products:
- type enum product|service
- name mínimo 2
- tax_profile_id requerido entero
- ids relacionados enteros si vienen
- booleans correctos
- regla UI:
  - si has_warranty = true, exigir warranty_profile_id
  - si track_expiration = true, exigir track_lots = true
  - si track_lots = true, exigir track_inventory = true

Price lists:
- name mínimo 2
- kind enum retail|wholesale|credit|special
- currency exactamente 3 letras mayúsculas

Product prices:
- price_list_id entero requerido
- price >= 0
- min_quantity >= 0 si viene
- valid_from y valid_to ISO si vienen
- si ambos existen, valid_to >= valid_from

Promotions:
- name mínimo 2
- type enum percentage|fixed_amount|buy_x_get_y|price_override
- valid_from y valid_to ISO requeridos
- si ambos existen, valid_to >= valid_from
- items array opcional
- cada item:
  - product_id entero requerido
  - min_quantity, discount_value, override_price, bonus_quantity >= 0 si vienen

Warehouses:
- branch_id entero requerido
- name mínimo 2
- booleans correctos

Warehouse locations:
- name mínimo 2
- booleans correctos

Inventory lots:
- warehouse_id entero requerido
- product_id entero requerido
- lot_number mínimo 2
- fechas ISO si vienen
- initial_quantity >= 0
- unit_cost >= 0 si viene
- supplier_contact_id entero si viene

Inventory adjustments:
- warehouse_id entero requerido
- product_id entero requerido
- inventory_lot_id entero si viene
- location_id entero si viene
- movement_type solo adjustment_in | adjustment_out en esta pantalla
- quantity >= 0.0001

==================================================
6. RESPUESTAS EXITOSAS
==================================================

Regla general:
- GET, POST y PATCH suelen devolver recurso serializado
- acciones operativas específicas devuelven { success: true }

No esperes que el backend te devuelva un mensaje de éxito uniforme.

Frontend debe:
- mostrar toast de éxito propio
- traducir ese toast usando active_business_language
- usar el recurso devuelto para refrescar estado local/lista/detalle

==================================================
7. ADAPTACIÓN DE PANTALLAS
==================================================

Quiero cambios mínimos y bien estructurados.
No reescribas toda la app.
Hazlo por capas.

Orden de trabajo:
1. capa API compartida
2. store/contexto auth
3. parser global de errores
4. util compartida de validaciones
5. adaptación de forms por módulo

Prioridad de pantallas:
1. auth bootstrap + auth/me
2. users
3. contacts
4. businesses/current
5. branches y terminals
6. rbac
7. inventory

==================================================
8. CRITERIOS DE ACEPTACIÓN
==================================================

Quiero que al final se cumpla esto:

- el frontend usa GET /auth/me como fuente única de contexto operativo
- los errores del backend se muestran sin ser sobrescritos por textos locales
- el idioma de mensajes de éxito sigue active_business_language
- no se mandan campos con nombres incorrectos al backend
- los formularios bloquean errores sintácticos obvios antes del submit
- users, contacts, branches, terminals, rbac y businesses/current quedan alineados
- inventory queda encaminado con la misma infraestructura compartida

==================================================
9. ENTREGA
==================================================

Al final dime:
- archivos modificados
- utilidades compartidas creadas o ajustadas
- cómo quedó el parser global de errores
- cómo quedó la resolución del idioma efectivo en frontend
- qué formularios quedaron adaptados
- qué validaciones frontend implementaste
- qué módulos quedaron completos
- qué quedó pendiente si algo no alcanzó
```

## Suggested Frontend Execution Notes

If the frontend team wants a phased rollout, this is the safest order:

1. shared API client
2. shared error parser
3. auth/me context store
4. shared form schema helpers
5. users and contacts
6. businesses/current
7. branches and rbac
8. inventory families

## Backend Expectations To Preserve

Frontend should preserve these backend guarantees:

- error text from backend is canonical when `message` exists
- `details[].message` is canonical for field validation when present
- `active_business_language` is the business-aware UI language anchor
- success messages are frontend-owned
- tenant context is derived from `mode`, `acting_business_id` and
  `acting_branch_id`
