# Backend Audit: Commercial Branch Assignments

## 1. Resumen Ejecutivo

Esta auditoría revisa exclusivamente el backend actual para tres módulos de assignments comerciales por sucursal:

- `contact branch assignments`
- `price list branch assignments`
- `promotion branch assignments`

Conclusiones principales:

1. `Contact branch assignments` sí soporta limpiar explícitamente `custom_price_list_id` y `account_manager_user_id` con `null`.
2. En `contact branch assignments`, omitir el campo en `PATCH` significa "no tocarlo".
3. En `contact branch assignments`, enviar `""` a campos ID no es contrato válido de backend; si ese valor llegara al backend como string vacío, debería fallar validación.
4. `Price list branch assignments` no soporta mover una asignación a otra sucursal por `PATCH`. El contrato actual fija la sucursal en creación.
5. En `price list branch assignments`, el cambio de sucursal no es una operación oficial del backend. Lo correcto hoy es `delete + create`.
6. `Promotion branch assignments` ya tiene capa backend completa para CRUD de assignment rows y listados por promoción y por sucursal.
7. Lo que todavía no está listo no es el CRUD del assignment, sino su uso dentro de un motor comercial más amplio.

Clasificación ejecutiva de hallazgos:

- Caso 1: comportamiento correcto de backend que puede ser mal interpretado por frontend.
- Caso 2: comportamiento correcto de backend; el contrato no soporta mover `branch_id` por `PATCH`.
- Caso 3: no es bug backend actual; la capa está lista para consumo CRUD, aunque el motor comercial global sigue siendo fase futura.

## 2. Alcance Y Archivos Revisados

Se revisó el código real actual de:

- `src/modules/contacts/controllers/contact-branch-assignments.controller.ts`
- `src/modules/contacts/dto/create-contact-branch-assignment.dto.ts`
- `src/modules/contacts/dto/update-contact-branch-assignment.dto.ts`
- `src/modules/contacts/entities/contact-branch-assignment.entity.ts`
- `src/modules/contacts/repositories/contact-branch-assignments.repository.ts`
- `src/modules/contacts/services/contact-branch-assignments.service.ts`
- `src/modules/inventory/controllers/price-list-branch-assignments.controller.ts`
- `src/modules/inventory/controllers/branch-price-lists.controller.ts`
- `src/modules/inventory/dto/create-price-list-branch-assignment.dto.ts`
- `src/modules/inventory/dto/update-price-list-branch-assignment.dto.ts`
- `src/modules/inventory/entities/price-list-branch-assignment.entity.ts`
- `src/modules/inventory/repositories/price-list-branch-assignments.repository.ts`
- `src/modules/inventory/services/price-list-branch-assignments.service.ts`
- `src/modules/inventory/controllers/promotion-branch-assignments.controller.ts`
- `src/modules/inventory/controllers/branch-promotions.controller.ts`
- `src/modules/inventory/dto/create-promotion-branch-assignment.dto.ts`
- `src/modules/inventory/dto/update-promotion-branch-assignment.dto.ts`
- `src/modules/inventory/entities/promotion-branch-assignment.entity.ts`
- `src/modules/inventory/repositories/promotion-branch-assignments.repository.ts`
- `src/modules/inventory/services/promotion-branch-assignments.service.ts`
- `src/modules/branches/policies/branch-access.policy.ts`
- `src/modules/branches/repositories/branches.repository.ts`
- `src/modules/common/utils/tenant-context.util.ts`
- `src/configure-app.ts`

## 3. Estado Real Actual: Contact Branch Assignments

## 3.1 Modelado

Entidad: `contact_branch_assignments`

Columnas relevantes para este análisis:

- `contact_id`
- `branch_id`
- `custom_price_list_id`
- `account_manager_user_id`
- `custom_credit_limit`
- `notes`
- banderas booleanas operativas

Relaciones relevantes:

- `custom_price_list_id -> price_lists.id`
- `account_manager_user_id -> users.id`

Restricciones relevantes:

- unicidad por `business_id + contact_id + branch_id`
- branch access obligatorio para operaciones mutantes
- validación de exclusividad activa por contacto

## 3.2 Endpoints Reales

- `GET /contacts/:contact_id/branches`
- `POST /contacts/:contact_id/branches`
- `PATCH /contacts/:contact_id/branches/:assignment_id`
- `DELETE /contacts/:contact_id/branches/:assignment_id`

No existe endpoint branch-centric para contactos en esta fase.

## 3.3 Response Shape Real

`GET /contacts/:contact_id/branches` devuelve:

```json
{
  "contact_id": 42,
  "mode": "global | scoped",
  "global_applies_to_all_branches": true,
  "assignments": [
    {
      "id": 5,
      "business_id": 1,
      "contact_id": 42,
      "branch": {
        "id": 2,
        "code": "BR-0002",
        "name": "Escazu",
        "business_name": "FastFact",
        "branch_number": "002",
        "is_active": true
      },
      "is_active": true,
      "is_default": false,
      "is_preferred": true,
      "is_exclusive": false,
      "sales_enabled": true,
      "purchases_enabled": true,
      "credit_enabled": false,
      "custom_credit_limit": null,
      "custom_price_list": {
        "id": 3,
        "code": "PL-0003",
        "name": "Retail",
        "kind": "sale",
        "currency": "CRC",
        "is_active": true
      },
      "account_manager": {
        "id": 12,
        "code": "US-0012",
        "name": "Ana Soto",
        "email": "ana@example.com",
        "status": "active"
      },
      "notes": "texto o null",
      "lifecycle": {
        "can_delete": true,
        "can_deactivate": true,
        "can_reactivate": false,
        "reasons": []
      },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

Detalle importante:

- `mode` se calcula con el total real de assignments del negocio.
- `assignments` sí se filtra por scope efectivo de sucursal del usuario.

Eso significa que este caso es posible:

```json
{
  "contact_id": 42,
  "mode": "scoped",
  "global_applies_to_all_branches": false,
  "assignments": []
}
```

Ese resultado no significa "no existen assignments", sino "no hay assignments visibles dentro del scope actual".

## 3.4 PATCH Contract Real

`PATCH /contacts/:contact_id/branches/:assignment_id` acepta hoy únicamente:

- `is_active?: boolean`
- `is_default?: boolean`
- `is_preferred?: boolean`
- `is_exclusive?: boolean`
- `sales_enabled?: boolean`
- `purchases_enabled?: boolean`
- `credit_enabled?: boolean`
- `custom_credit_limit?: number | null`
- `custom_price_list_id?: number | null`
- `account_manager_user_id?: number | null`
- `notes?: string | null`

No acepta:

- `branch_id`
- `contact_id`
- `business_id`

## 3.5 Semántica Real De Valores En PATCH

### `custom_price_list_id`

- campo ausente: no tocar el valor actual
- `null`: limpiar/desasignar explícitamente
- `undefined`: no existe en JSON; si se omite durante serialización, backend lo ve como campo ausente
- `""`: no es contrato válido de backend para este campo; si llegara como string vacío directo al backend, debe fallar validación de entero

### `account_manager_user_id`

- campo ausente: no tocar el valor actual
- `null`: limpiar/desasignar explícitamente
- `undefined`: equivalente práctico a campo ausente
- `""`: no es contrato válido de backend para este campo; si llegara como string vacío directo al backend, debe fallar validación de entero

### `custom_credit_limit`

- campo ausente: no tocar
- `null`: limpiar
- `""`: no es contrato válido; si llega al backend directo, debe fallar validación numérica

### `notes`

- campo ausente: no tocar
- `null`: limpiar
- `""`: se acepta como string y luego el service lo normaliza a `null`
- `"   "`: también se normaliza a `null`

### Banderas booleanas

- campo ausente: no tocar
- `true | false`: actualización válida
- `null`: no debería asumirse como contrato oficial de backend, aunque `@IsOptional()` no lo bloquea a nivel validator; como la columna no es nullable, esto no debe considerarse input soportado

## 3.6 Qué Hace El Backend Realmente Para Limpiar IDs

El service usa esta semántica:

- si `dto.custom_price_list_id !== undefined`, intenta resolver el valor
- si el valor es `null`, la resolución retorna `null`
- luego asigna `assignment.custom_price_list_id = null`

El mismo patrón aplica para `account_manager_user_id`.

Conclusión técnica:

- sí, el backend soporta desasignar explícitamente ambos campos con `null`
- no, omitir el campo no limpia nada

## 3.7 Validaciones De Negocio Reales

Al crear o actualizar:

- el `contact` debe existir en el negocio
- la `branch` debe existir en el negocio
- el usuario actual debe poder acceder a esa branch
- `custom_price_list_id`, si se envía y no es `null`, debe:
  - existir en el mismo negocio
  - estar activa
- `account_manager_user_id`, si se envía y no es `null`, debe:
  - existir en el mismo negocio
  - ser compatible con la branch del assignment
- solo puede existir un assignment activo y exclusivo por contacto

Errores de dominio relevantes:

- `CONTACT_NOT_FOUND`
- `CONTACT_BRANCH_ASSIGNMENT_NOT_FOUND`
- `CONTACT_BRANCH_ASSIGNMENT_DUPLICATE`
- `PRICE_LIST_NOT_FOUND`
- `PRICE_LIST_INACTIVE`
- `USER_NOT_FOUND`
- `CONTACT_ACCOUNT_MANAGER_BRANCH_SCOPE_INVALID`
- `CONTACT_BRANCH_EXCLUSIVE_CONFLICT`
- `BRANCH_NOT_FOUND`
- `BRANCH_ACCESS_FORBIDDEN`

## 3.8 Clasificación Del Hallazgo 1

Hallazgo:

- desde UI se intenta limpiar `custom_price_list_id` y `account_manager_user_id`, pero aparentemente se omiten en el request final

Clasificación:

- `3. Comportamiento correcto del backend que frontend está interpretando mal`

Justificación:

- el backend sí soporta desasignación explícita con `null`
- el contrato distingue entre campo ausente y campo `null`
- si el frontend transforma `"" | null | undefined` a `undefined`, entonces está rompiendo la intención del usuario antes de llegar al backend

Observación secundaria:

- conviene documentar mejor esta semántica para que frontend no asuma que "vacío" equivale a "clear"

## 4. Estado Real Actual: Price List Branch Assignments

## 4.1 Modelado

Entidad: `price_list_branch_assignments`

Columnas relevantes:

- `price_list_id`
- `branch_id`
- `is_active`
- `is_default`
- `notes`

Restricción clave:

- unicidad por `business_id + price_list_id + branch_id`

## 4.2 Endpoints Reales

- `GET /price-lists/:price_list_id/branches`
- `POST /price-lists/:price_list_id/branches`
- `PATCH /price-lists/:price_list_id/branches/:assignment_id`
- `DELETE /price-lists/:price_list_id/branches/:assignment_id`
- `GET /branches/:branch_id/price-lists`

## 4.3 Response Shape Real

`GET /price-lists/:price_list_id/branches` devuelve:

```json
{
  "price_list_id": 3,
  "assignments": [
    {
      "id": 8,
      "business_id": 1,
      "branch": {
        "id": 2,
        "code": "BR-0002",
        "name": "Escazu",
        "business_name": "FastFact",
        "branch_number": "002",
        "is_active": true
      },
      "price_list": {
        "id": 3,
        "code": "PL-0003",
        "name": "Retail",
        "kind": "sale",
        "currency": "CRC",
        "is_default": false,
        "is_active": true
      },
      "is_active": true,
      "is_default": true,
      "notes": "texto o null",
      "lifecycle": {
        "can_delete": true,
        "can_deactivate": true,
        "can_reactivate": false,
        "reasons": []
      },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

`GET /branches/:branch_id/price-lists` además devuelve:

```json
{
  "branch_id": 2,
  "default_price_list_id": 3,
  "assignments": [ ... ]
}
```

## 4.4 PATCH Contract Real

`PATCH /price-lists/:price_list_id/branches/:assignment_id` acepta hoy únicamente:

- `is_active?: boolean`
- `is_default?: boolean`
- `notes?: string | null`

No acepta:

- `branch_id`
- `price_list_id`
- `business_id`

## 4.5 ¿Backend Soporta Cambiar `branch_id` Por PATCH?

No.

Razones contractuales reales:

1. `UpdatePriceListBranchAssignmentDto` no declara `branch_id`.
2. El backend usa `ValidationPipe` global con:
   - `whitelist: true`
   - `forbidNonWhitelisted: true`
3. Si llega `branch_id` en el body de update, eso debe tratarse como propiedad no permitida.
4. El service nunca intenta leer ni mutar `assignment.branch_id`.

Conclusión:

- mover una asignación a otra sucursal vía `PATCH` no es una operación soportada oficialmente

## 4.6 Operación Correcta Para “Mover” Una Asignación

Con el contrato actual del backend, lo correcto sería:

1. borrar la asignación actual
2. crear una nueva asignación en la sucursal destino

Eso respeta:

- la unicidad `business_id + price_list_id + branch_id`
- la semántica de ownership del assignment
- la claridad de lifecycle del registro

## 4.7 Validaciones De Negocio Reales

En creación:

- `price_list` debe existir en el negocio
- `branch` debe existir en el negocio
- el usuario actual debe poder acceder a la branch
- no puede existir duplicado `branch + price_list`
- si el assignment será activo o default, la `price_list` debe estar activa
- `is_default = true` exige `is_active = true`

En update:

- el assignment debe existir y pertenecer a la `price_list` del path
- se valida branch access sobre la branch original del assignment
- si se desactiva el assignment, backend limpia `is_default`
- si se marca como default, backend hace `unset` del resto de defaults de esa branch

Errores de dominio relevantes:

- `PRICE_LIST_NOT_FOUND`
- `BRANCH_NOT_FOUND`
- `BRANCH_PRICE_LIST_ASSIGNMENT_NOT_FOUND`
- `BRANCH_PRICE_LIST_ASSIGNMENT_DUPLICATE`
- `BRANCH_PRICE_LIST_DEFAULT_REQUIRES_ACTIVE_ASSIGNMENT`
- `PRICE_LIST_INACTIVE`
- `BRANCH_ACCESS_FORBIDDEN`

## 4.8 Qué Valores Significan Qué En PATCH

- campo ausente: no tocar
- `is_active: true | false`: actualización válida
- `is_default: true | false`: actualización válida
- `notes: null`: limpiar
- `notes: ""`: termina en `null` por normalización del service
- `branch_id`: no soportado; no debe asumirse como parte del contrato

## 4.9 Clasificación Del Hallazgo 2

Hallazgo:

- el frontend permite cambiar `branch_id` en edición

Clasificación:

- `3. Comportamiento correcto del backend que frontend está interpretando mal`

Justificación:

- el contrato de update no soporta `branch_id`
- el backend no modela ni valida “move assignment”
- la sucursal del assignment debe considerarse fija una vez creado

Observación adicional:

- si el negocio realmente quisiera soportar “mover” assignment, eso requeriría un contrato explícito nuevo, no asumirlo por PATCH genérico

## 5. Estado Real Actual: Promotion Branch Assignments

## 5.1 Modelado

Entidad: `promotion_branch_assignments`

Columnas relevantes:

- `promotion_id`
- `branch_id`
- `is_active`
- `notes`

Restricción clave:

- unicidad por `business_id + promotion_id + branch_id`

No existe `is_default` para promociones, y eso es coherente con el diseño actual.

## 5.2 Endpoints Reales

- `GET /promotions/:promotion_id/branches`
- `POST /promotions/:promotion_id/branches`
- `PATCH /promotions/:promotion_id/branches/:assignment_id`
- `DELETE /promotions/:promotion_id/branches/:assignment_id`
- `GET /branches/:branch_id/promotions`

## 5.3 Capas Backend Reales Ya Existentes

Ya existen hoy:

- entidad
- DTO create/update
- repository
- service
- controller por promoción
- controller por branch
- serialización de respuesta
- permisos RBAC específicos

En otras palabras: la capa CRUD de backend sí existe y sí está cableada.

## 5.4 Response Shape Real

```json
{
  "promotion_id": 9,
  "assignments": [
    {
      "id": 4,
      "business_id": 1,
      "branch": {
        "id": 2,
        "code": "BR-0002",
        "name": "Escazu",
        "business_name": "FastFact",
        "branch_number": "002",
        "is_active": true
      },
      "promotion": {
        "id": 9,
        "code": "PN-0009",
        "name": "Temporada",
        "type": "percentage",
        "valid_from": "...",
        "valid_to": "...",
        "is_active": true
      },
      "is_active": true,
      "notes": "texto o null",
      "lifecycle": {
        "can_delete": true,
        "can_deactivate": true,
        "can_reactivate": false,
        "reasons": []
      },
      "created_at": "...",
      "updated_at": "..."
    }
  ]
}
```

`GET /branches/:branch_id/promotions` devuelve:

```json
{
  "branch_id": 2,
  "assignments": [ ... ]
}
```

## 5.5 PATCH Contract Real

`PATCH /promotions/:promotion_id/branches/:assignment_id` acepta hoy únicamente:

- `is_active?: boolean`
- `notes?: string | null`

No acepta:

- `branch_id`
- `promotion_id`
- `business_id`

## 5.6 Validaciones De Negocio Reales

En creación:

- `promotion` debe existir en el negocio
- `branch` debe existir en el negocio
- el usuario actual debe poder acceder a la branch
- no puede existir duplicado `branch + promotion`
- si el assignment será activo, la `promotion` debe estar activa

En update:

- el assignment debe existir y pertenecer a la `promotion` del path
- se valida branch access sobre la branch original del assignment
- si `is_active` queda en `true`, la `promotion` debe seguir activa

Errores de dominio relevantes:

- `PROMOTION_NOT_FOUND`
- `BRANCH_NOT_FOUND`
- `BRANCH_PROMOTION_ASSIGNMENT_NOT_FOUND`
- `BRANCH_PROMOTION_ASSIGNMENT_DUPLICATE`
- `PROMOTION_INACTIVE`
- `BRANCH_ACCESS_FORBIDDEN`

## 5.7 Qué Está Completo Y Qué No

Completo en backend para esta fase:

- CRUD de assignment rows
- listados por promoción
- listados por sucursal
- validación de negocio básica
- lifecycle básico
- protección por tenant y branch access

No implementado todavía:

- motor que resuelva automáticamente si una promoción aplica dentro de un flujo comercial mayor
- semántica avanzada de prioridad, stacking o coexistencia con pricing efectivo
- endpoint singular por assignment id

Conclusión:

- para montar una UI CRUD de “Promoción > Sucursales” o “Sucursal > Promociones”, backend ya está suficientemente listo
- lo que no existe aún no es el CRUD, sino la capa comercial superior que consuma esas reglas

## 5.8 Clasificación Del Hallazgo 3

Hallazgo:

- “Promotion branch assignments ya existe, pero no está claro si está lista”

Clasificación:

- `5. Mejora futura, no bug actual`

Justificación:

- el backend ya soporta el CRUD de assignments y los listados necesarios
- lo pendiente es el consumo desde frontend o módulos comerciales futuros
- no se observó una carencia estructural del backend para esta capa específica

## 6. Contrato Real Por Módulo

## 6.1 Contact Branch Assignments

### Create

Obligatorio:

- `branch_id`

Opcional:

- banderas booleanas
- `custom_credit_limit`
- `custom_price_list_id`
- `account_manager_user_id`
- `notes`

### Update

Campos soportados:

- `is_active`
- `is_default`
- `is_preferred`
- `is_exclusive`
- `sales_enabled`
- `purchases_enabled`
- `credit_enabled`
- `custom_credit_limit`
- `custom_price_list_id`
- `account_manager_user_id`
- `notes`

Semántica:

- ausente: no tocar
- `null`:
  - sí limpia `custom_credit_limit`
  - sí limpia `custom_price_list_id`
  - sí limpia `account_manager_user_id`
  - sí limpia `notes`
- `""`:
  - no válido para IDs ni números
  - sí puede terminar en `null` para `notes`

Operaciones oficialmente soportadas:

- listar contexto por contacto
- crear assignment
- actualizar campos del assignment
- borrar assignment

Operaciones que no deben asumirse:

- cambiar `branch_id`
- cambiar `contact_id`

## 6.2 Price List Branch Assignments

### Create

Obligatorio:

- `branch_id`

Opcional:

- `is_active`
- `is_default`
- `notes`

### Update

Campos soportados:

- `is_active`
- `is_default`
- `notes`

Semántica:

- ausente: no tocar
- `notes: null`: limpiar
- `notes: ""`: limpiar por normalización
- `branch_id`: no soportado

Operaciones oficialmente soportadas:

- listar assignments de una price list
- listar price lists de una branch
- crear assignment
- actualizar flags y notes
- borrar assignment

Operaciones que no deben asumirse:

- mover assignment a otra branch vía PATCH
- cambiar `price_list_id` vía PATCH

## 6.3 Promotion Branch Assignments

### Create

Obligatorio:

- `branch_id`

Opcional:

- `is_active`
- `notes`

### Update

Campos soportados:

- `is_active`
- `notes`

Semántica:

- ausente: no tocar
- `notes: null`: limpiar
- `notes: ""`: limpiar por normalización
- `branch_id`: no soportado

Operaciones oficialmente soportadas:

- listar assignments de una promoción
- listar promociones de una branch
- crear assignment
- actualizar flags y notes
- borrar assignment

Operaciones que no deben asumirse:

- mover assignment a otra branch vía PATCH
- cambiar `promotion_id` vía PATCH

## 7. Clasificación Consolidada De Hallazgos

### Hallazgo 1

“No se limpia `custom_price_list_id` / `account_manager_user_id`”

Clasificación principal:

- `3. Comportamiento correcto del backend que frontend está interpretando mal`

### Hallazgo 2

“La UI permite cambiar `branch_id` en price list branch assignments”

Clasificación principal:

- `3. Comportamiento correcto del backend que frontend está interpretando mal`

### Hallazgo 3

“Promotion branch assignments existe pero falta confirmar si está lista”

Clasificación principal:

- `5. Mejora futura, no bug actual`

## 8. Reglas Correctas Que Debe Respetar Frontend Después

## 8.1 Contact Branch Assignments

- Para desasignar `custom_price_list_id`, enviar explícitamente `null`
- Para desasignar `account_manager_user_id`, enviar explícitamente `null`
- Para no tocar esos campos, omitirlos del PATCH
- No usar `""` como valor semántico de clear para IDs

## 8.2 Price List Branch Assignments

- No asumir que `branch_id` se puede editar en update
- Si se quiere mover una asignación de sucursal, hacer `delete + create`
- Usar PATCH solo para `is_active`, `is_default` y `notes`

## 8.3 Promotion Branch Assignments

- Backend ya permite CRUD de assignments
- La UI puede consumir esta capa sin inventar backend adicional para el CRUD
- No asumir todavía motor de aplicación comercial final; eso es fase futura

## 9. Qué Soporta Hoy El Backend Y Qué No

### Sí soporta

- desasignar IDs nullable con `null` en contact branch assignments
- fijar defaults por branch en price list branch assignments
- listar assignments por parent y por branch en price lists y promotions
- CRUD completo de rows de assignment para los tres módulos

### No soporta

- mover `branch_id` vía PATCH en price list assignments
- mover `branch_id` vía PATCH en promotion assignments
- endpoint singular por assignment id en promotions
- motor efectivo final de promociones por branch

### Está ambiguo solo si no se documenta

- `mode=scoped` con `assignments=[]` puede deberse a branch scope, no a inexistencia global
- `null` y campo ausente tienen semánticas distintas en PATCH

## 10. Próximos Pasos Recomendados

1. Alinear frontend para que use `null` explícito al desasignar IDs nullable en contact branch assignments.
2. Bloquear en frontend cualquier intento de editar `branch_id` en update de price list branch assignments.
3. Montar la UI CRUD de promotion branch assignments usando los endpoints ya existentes.
4. Opcionalmente, documentar de forma más visible en backend la semántica:
   - omitido = no tocar
   - `null` = limpiar
5. En una fase posterior, diseñar el motor comercial superior que consuma assignments de price lists y promotions.
