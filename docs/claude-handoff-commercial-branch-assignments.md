# Claude Handoff: Branch Commercial Assignments

## 1. Purpose

Este documento explica, para Claude o cualquier agente de frontend, qué se implementó en backend para manejar contexto comercial por sucursal sin duplicar entidades maestras globales.

El alcance cubre:

- contactos por sucursal
- listas de precios por sucursal
- promociones por sucursal

No cubre todavía:

- motor de precio efectivo por sucursal
- overrides de precios por sucursal
- aplicación automática de promociones dentro de un flujo de venta

## 2. Filosofía De Diseño

Se siguió esta regla:

1. Entidad global por empresa
2. Assignment por sucursal
3. Override por sucursal solo si luego hace falta

Eso significa:

- `contacts` siguen siendo globales por empresa
- `price_lists` siguen siendo globales por empresa
- `promotions` siguen siendo globales por empresa

Y se agregó una capa nueva de assignments por sucursal:

- `contact_branch_assignments`
- `price_list_branch_assignments`
- `promotion_branch_assignments`

No se duplicó ninguna entidad maestra por branch.

## 3. Qué Se Implementó

## 3.1 Contacts -> Branch Assignments

Se creó la tabla `contact_branch_assignments`.

Sirve para guardar, por sucursal:

- si el contacto está activo o no en esa sucursal
- si es preferido
- si es default
- si es exclusivo
- si ventas están habilitadas
- si compras están habilitadas
- si crédito está habilitado
- límite de crédito específico
- lista de precios comercial sugerida
- encargado comercial
- notas

Campos principales:

- `business_id`
- `contact_id`
- `branch_id`
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

Restricción clave:

- un assignment por `business_id + contact_id + branch_id`

## 3.2 Price Lists -> Branch Assignments

Se creó la tabla `price_list_branch_assignments`.

Sirve para indicar:

- qué listas de precio están habilitadas en una sucursal
- cuál es la lista default de esa sucursal

Campos principales:

- `business_id`
- `price_list_id`
- `branch_id`
- `is_active`
- `is_default`
- `notes`

Restricción clave:

- un assignment por `business_id + price_list_id + branch_id`

## 3.3 Promotions -> Branch Assignments

Se creó la tabla `promotion_branch_assignments`.

Sirve para indicar:

- en qué sucursales aplica una promoción
- si esa promoción está activa o no para esa sucursal

Campos principales:

- `business_id`
- `promotion_id`
- `branch_id`
- `is_active`
- `notes`

Restricción clave:

- un assignment por `business_id + promotion_id + branch_id`

## 4. Contrato Real Del Backend

## 4.1 Contact Branch Assignments

Endpoints:

- `GET /contacts/:contact_id/branches`
- `POST /contacts/:contact_id/branches`
- `PATCH /contacts/:contact_id/branches/:assignment_id`
- `DELETE /contacts/:contact_id/branches/:assignment_id`

Comportamiento importante:

- si un contacto no tiene assignments, backend lo considera `global`
- si tiene al menos uno, backend lo considera `scoped`
- el listado de assignments visibles se filtra por branch scope del usuario

`PATCH` soporta:

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

Semántica crítica:

- campo ausente = no tocar
- `null` = limpiar/desasignar en los campos nullable
- `""` no es contrato válido para IDs; frontend debe convertir a `null` si quiere limpiar

Esto es especialmente importante para:

- `custom_price_list_id`
- `account_manager_user_id`

Si frontend quiere “Sin lista de precios” o “Sin account manager”, debe mandar `null`, no omitir el campo.

## 4.2 Price List Branch Assignments

Endpoints:

- `GET /price-lists/:price_list_id/branches`
- `POST /price-lists/:price_list_id/branches`
- `PATCH /price-lists/:price_list_id/branches/:assignment_id`
- `DELETE /price-lists/:price_list_id/branches/:assignment_id`
- `GET /branches/:branch_id/price-lists`

`PATCH` soporta solo:

- `is_active`
- `is_default`
- `notes`

No soporta:

- `branch_id`

Eso significa:

- no se puede “mover” una asignación de una sucursal a otra vía update
- si negocio quiere moverla, el flujo correcto actual es:
  1. borrar assignment actual
  2. crear assignment nuevo en la sucursal destino

Regla importante:

- si un assignment queda `is_default=true`, backend limpia otros defaults de esa branch
- si un assignment se desactiva, backend le quita `is_default`

## 4.3 Promotion Branch Assignments

Endpoints:

- `GET /promotions/:promotion_id/branches`
- `POST /promotions/:promotion_id/branches`
- `PATCH /promotions/:promotion_id/branches/:assignment_id`
- `DELETE /promotions/:promotion_id/branches/:assignment_id`
- `GET /branches/:branch_id/promotions`

`PATCH` soporta:

- `is_active`
- `notes`

No soporta:

- `branch_id`

La capa CRUD sí está lista para frontend.
Lo que no existe todavía es el motor comercial superior que evalúe automáticamente la promo durante pricing/venta.

## 5. Reglas De Negocio Que Ya Quedaron En Backend

## 5.1 Contacts

- el contacto debe existir dentro del `business_id`
- la branch debe existir dentro del `business_id`
- el usuario debe tener acceso a esa branch
- si se envía `custom_price_list_id`, la lista debe existir y estar activa
- si se envía `account_manager_user_id`, el usuario debe existir y ser compatible con la branch
- solo puede existir una exclusividad activa por contacto

## 5.2 Price Lists

- la lista debe existir dentro del `business_id`
- la branch debe existir dentro del `business_id`
- el usuario debe tener acceso a esa branch
- no se puede duplicar branch + price list
- una lista inactiva no puede quedar activa/default dentro de una branch
- default requiere active

## 5.3 Promotions

- la promoción debe existir dentro del `business_id`
- la branch debe existir dentro del `business_id`
- el usuario debe tener acceso a esa branch
- no se puede duplicar branch + promotion
- una promoción inactiva no puede quedar activa en una branch

## 6. Permisos Que Se Agregaron

Contacts:

- `contacts.view_branch_assignments`
- `contacts.create_branch_assignment`
- `contacts.update_branch_assignment`
- `contacts.delete_branch_assignment`

Price lists:

- `price_lists.view_branch_assignments`
- `price_lists.create_branch_assignment`
- `price_lists.update_branch_assignment`
- `price_lists.delete_branch_assignment`

Promotions:

- `promotions.view_branch_assignments`
- `promotions.create_branch_assignment`
- `promotions.update_branch_assignment`
- `promotions.delete_branch_assignment`

Además del permiso RBAC, backend también valida acceso real a la sucursal dentro del service.

## 7. Qué Claude Debe Asumir En Frontend

## 7.1 Sobre Contacts

Claude debe asumir:

- un contacto puede ser global o scoped
- `mode=global` significa que no tiene assignments
- `mode=scoped` significa que sí tiene assignments en el negocio
- `custom_price_list_id` y `account_manager_user_id` se limpian con `null`
- omitir el campo en update significa “no tocar”

UI recomendada:

- pestaña “Sucursales” dentro del detalle del contacto
- tabla con:
  - sucursal
  - activo
  - preferido
  - default
  - exclusivo
  - ventas
  - compras
  - crédito
  - límite
  - lista de precio
  - encargado
  - notas

## 7.2 Sobre Price Lists

Claude debe asumir:

- una lista sigue siendo global
- la branch solo decide si está habilitada y si es default allí
- no se puede editar `branch_id` en update

UI recomendada:

- pestaña “Sucursales” dentro del detalle de la lista
- tabla con:
  - sucursal
  - activa
  - default
  - notas

Regla UX importante:

- no ofrecer “cambiar sucursal” en edición
- si se quiere mover, la UI debería tratarlo como eliminar + crear

## 7.3 Sobre Promotions

Claude debe asumir:

- una promoción sigue siendo global
- el assignment decide dónde aplica
- la capa CRUD backend ya existe y se puede consumir

UI recomendada:

- pestaña “Sucursales” dentro del detalle de la promoción
- tabla con:
  - sucursal
  - activa
  - notas

## 8. Qué Todavía No Está Hecho

Estas cosas no deben asumirse como ya resueltas:

- cálculo de precio efectivo por sucursal
- validación automática de promociones dentro de venta/cotización
- overrides de precio por branch
- obligatoriedad de que `custom_price_list_id` del contacto ya esté asignada a esa misma branch

Eso quedó preparado conceptualmente, pero no implementado aún como motor comercial completo.

## 9. Qué Archivos Son La Fuente De Verdad

Contacts:

- `src/modules/contacts/entities/contact-branch-assignment.entity.ts`
- `src/modules/contacts/dto/create-contact-branch-assignment.dto.ts`
- `src/modules/contacts/dto/update-contact-branch-assignment.dto.ts`
- `src/modules/contacts/repositories/contact-branch-assignments.repository.ts`
- `src/modules/contacts/services/contact-branch-assignments.service.ts`
- `src/modules/contacts/controllers/contact-branch-assignments.controller.ts`

Price lists:

- `src/modules/inventory/entities/price-list-branch-assignment.entity.ts`
- `src/modules/inventory/dto/create-price-list-branch-assignment.dto.ts`
- `src/modules/inventory/dto/update-price-list-branch-assignment.dto.ts`
- `src/modules/inventory/repositories/price-list-branch-assignments.repository.ts`
- `src/modules/inventory/services/price-list-branch-assignments.service.ts`
- `src/modules/inventory/controllers/price-list-branch-assignments.controller.ts`
- `src/modules/inventory/controllers/branch-price-lists.controller.ts`

Promotions:

- `src/modules/inventory/entities/promotion-branch-assignment.entity.ts`
- `src/modules/inventory/dto/create-promotion-branch-assignment.dto.ts`
- `src/modules/inventory/dto/update-promotion-branch-assignment.dto.ts`
- `src/modules/inventory/repositories/promotion-branch-assignments.repository.ts`
- `src/modules/inventory/services/promotion-branch-assignments.service.ts`
- `src/modules/inventory/controllers/promotion-branch-assignments.controller.ts`
- `src/modules/inventory/controllers/branch-promotions.controller.ts`

Permisos:

- `src/modules/common/enums/permission-key.enum.ts`
- `src/modules/rbac/services/rbac-seed.service.ts`

## 10. Resumen Para Claude

Si Claude va a montar frontend sobre esta fase, debe entender esto:

- los maestros siguen globales
- lo branch-aware está en tablas de assignment
- no hay que duplicar contactos, listas o promociones por sucursal
- `null` importa semánticamente en contact branch assignments
- `branch_id` no es editable en updates de assignments de listas ni promociones
- promotions por sucursal ya tiene backend suficiente para una UI CRUD
- el motor comercial avanzado queda para fase futura
