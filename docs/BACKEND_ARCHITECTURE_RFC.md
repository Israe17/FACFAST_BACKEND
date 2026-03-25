# Backend Architecture RFC

## Objetivo

Definir una arquitectura unica para todo el backend que sea:

- coherente entre modulos
- segura para flujos transaccionales
- escalable para miles de empresas multi-tenant
- mantenible sin caer en services gigantes o CRUD con side effects acoplados

Este RFC no obliga por ahora a apagar `DB_SYNCHRONIZE` ni a adoptar
migraciones formales como prerequisito inmediato. Mientras esa etapa llega, la
regla operativa es hacer cambios de esquema solo aditivos y seguros.

## Principios

1. Cada modulo sigue la misma forma:
   `controller -> command/query use cases -> policies -> repositories -> serializers/read models`
2. Los controllers no contienen logica de negocio.
3. Los cambios de estado viven en command use cases.
4. Las lecturas viven en query use cases.
5. Las reglas de acceso, lifecycle y consistencia se expresan en policies.
6. Los repositories encapsulan acceso a datos, joins y locks.
7. Los serializers definen el contrato de salida del modulo.
8. Todo recurso tenant-aware incluye `business_id`.

## Estructura Estandar De Modulo

```text
src/modules/<bounded-context>/
  controllers/
  contracts/
  dto/
  entities/
  enums/
  policies/
  repositories/
  serializers/
  services/
  use-cases/
```

### Responsabilidad por capa

- `controllers/`
  - parsean params/body/query
  - aplican guards/decorators
  - delegan a un use case o service delgado
- `use-cases/`
  - `*.use-case.ts` para comandos
  - `*.query.use-case.ts` para lecturas
  - orquestan transacciones, policies y repositorios
- `policies/`
  - acceso por tenant/sucursal/rol
  - transiciones validas de estado
  - validaciones cross-module
- `repositories/`
  - queries de lectura
  - locks pesimistas u optimistas
  - filtros tenant-aware
- `serializers/`
  - convierten entidades a contratos estables
- `services/`
  - solo fachadas delgadas o integraciones compartidas
  - no deben mezclar workflow, permisos y SQL

## Abstracciones Compartidas

Las interfaces base viven en `src/modules/common/application/interfaces/`:

- `command-use-case.interface.ts`
- `query-use-case.interface.ts`
- `access-policy.interface.ts`
- `transition-policy.interface.ts`
- `entity-serializer.interface.ts`

Todo modulo nuevo debe implementar esas abstracciones cuando aplique.

## Patrón De Escritura

Para cualquier flujo mutante:

1. El controller delega.
2. El command use case resuelve `business_id` y contexto efectivo.
3. El use case carga el agregado con el lock apropiado si hay concurrencia.
4. `AccessPolicy` valida alcance.
5. `TransitionPolicy` valida cambio de estado.
6. Policies adicionales validan consistencia con otros modulos.
7. El use case persiste cambios.
8. El serializer genera el contrato de salida.

Ejemplos de flujos que deben seguir este modelo:

- confirmar/cancelar orden de venta
- postear movimientos de inventario
- emitir documentos electronicos
- aplicar pagos o notas
- asignar contactos, promociones o listas a sucursales

## Patrón De Lectura

Toda lectura relevante debe entrar por un query use case.

Reglas:

- las lecturas filtran por `business_id` y alcance de sucursal
- las lecturas no usan entidades como contrato publico
- las listas de alto volumen deben preferir cursor pagination
- las lecturas de dashboards y reportes deben apoyarse en read models o
  proyecciones, no en joins OLTP pesados dentro de requests criticas

## Politicas Obligatorias

Cada dominio con cambios de estado debe tener, como minimo:

- `AccessPolicy`
- `LifecyclePolicy`

Y cuando aplique:

- `InventoryPolicy`
- `AccountingPolicy`
- `DocumentPolicy`
- `PricingPolicy`

La idea es que las reglas de negocio no queden duplicadas entre controllers,
services y repositories.

## Estrategia Multi-Tenant

- Toda tabla tenant-aware debe guardar `business_id`.
- Los filtros por tenant deben vivir en repositorios y policies.
- Los indices operativos deben iniciar por `business_id`.
- Cuando exista alcance por sucursal, tambien se debe contemplar `branch_id`.

Indices recomendados para tablas de alto trafico:

- `(business_id, created_at DESC, id DESC)`
- `(business_id, branch_id, created_at DESC, id DESC)`
- `(business_id, status, created_at DESC, id DESC)`
- `(business_id, code)`

## Rendimiento Y Escalabilidad

### Reglas de aplicacion

- evitar `N+1` en flujos transaccionales
- preferir operaciones batch sobre `save()` por fila cuando el flujo lo permita
- usar locks solo sobre filas afectadas
- separar side effects lentos a colas y workers
- no bloquear requests HTTP con PDF, email, XML, webhooks o integraciones

### Reglas de lectura

- evitar `offset pagination` en endpoints de crecimiento alto
- introducir endpoints cursor-first para dominios voluminosos
- mover busquedas pesadas a `pg_trgm`, full text o motores dedicados cuando
  el volumen lo justifique
- usar cache para catalogos, permisos y configuraciones estables
- no usar cache como fuente de verdad de stock, reservas o saldos

### Reglas de base de datos mientras siga `DB_SYNCHRONIZE=true`

- solo cambios de esquema aditivos
- no renombrar columnas/tablas como estrategia habitual
- evitar cambios destructivos en entidades existentes
- documentar cada tabla nueva y sus indices en el RFC del modulo

## Procesos Asincronos

Facturacion electronica, notificaciones y procesos lentos deben converger a:

- outbox de eventos
- workers asincronos
- idempotencia por mensaje o documento

No es obligatorio implementar todo eso hoy, pero todo modulo nuevo debe quedar
listo para esa evolucion.

Base ya implementada:

- `src/modules/common/entities/idempotency-key.entity.ts`
- `src/modules/common/repositories/idempotency-keys.repository.ts`
- `src/modules/common/services/idempotency.service.ts`
- `src/modules/common/entities/outbox-event.entity.ts`
- `src/modules/common/repositories/outbox-events.repository.ts`
- `src/modules/common/services/outbox.service.ts`
- `src/modules/sales/services/electronic-document-outbox-worker.service.ts`

## Modulo Piloto

`sales` es el primer modulo alineado a esta arquitectura de punta a punta.
Dentro de `sales`, `electronic-documents` ya quedo alineado con contracts,
serializer, policies y use cases, y ahora deja solicitud de emision en outbox
en la misma transaccion, con worker consumidor para procesarla.
`inventory` ya tiene slices alineados en:

- `dispatch-orders`
- `warehouses`
- `warehouse-stock`
- `inventory-movements`
- `inventory-lots`
- `pricing`:
  `price-lists`, `product-prices`, `promotions`,
  `price-list-branch-assignments` y `promotion-branch-assignments`
- `contacts`:
  `contacts` y `contact-branch-assignments`
- `branches`:
  `branches` y `terminals`
- `rbac`:
  `roles` y `permissions`
- `platform`:
  `platform-businesses` y `platform-context`

Ademas, el core transaccional de inventario ya empezo a converger a
procesamiento batch en:

- `InventoryLedgerService`
- `InventoryReservationsService`
- `SaleOrderInventoryPolicy`

Referencias:

- `src/modules/sales/policies/sale-order-mode.policy.ts`
- `src/modules/sales/use-cases/create-sale-order.use-case.ts`
- `src/modules/sales/use-cases/confirm-sale-order.use-case.ts`
- `src/modules/sales/use-cases/cancel-sale-order.use-case.ts`
- `src/modules/sales/use-cases/update-sale-order.use-case.ts`
- `src/modules/sales/use-cases/delete-sale-order.use-case.ts`
- `src/modules/sales/use-cases/get-sale-order.query.use-case.ts`
- `src/modules/sales/use-cases/get-sale-orders-list.query.use-case.ts`
- `src/modules/sales/use-cases/get-sale-orders-page.query.use-case.ts`
- `src/modules/sales/use-cases/get-sale-orders-cursor.query.use-case.ts`
- `src/modules/sales/policies/sale-order-access.policy.ts`
- `src/modules/sales/policies/sale-order-lifecycle.policy.ts`
- `src/modules/sales/serializers/sale-order.serializer.ts`
- `src/modules/sales/policies/electronic-document-access.policy.ts`
- `src/modules/sales/policies/electronic-document-lifecycle.policy.ts`
- `src/modules/sales/serializers/electronic-document.serializer.ts`
- `src/modules/sales/use-cases/get-electronic-documents-list.query.use-case.ts`
- `src/modules/sales/use-cases/get-electronic-documents-page.query.use-case.ts`
- `src/modules/sales/use-cases/get-electronic-documents-cursor.query.use-case.ts`
- `src/modules/sales/use-cases/get-electronic-document.query.use-case.ts`
- `src/modules/sales/use-cases/emit-electronic-document.use-case.ts`
- `src/modules/sales/use-cases/process-electronic-document-emission-outbox.use-case.ts`
- `src/modules/sales/services/electronic-document-outbox-worker.service.ts`
- `src/modules/inventory/policies/dispatch-order-access.policy.ts`
- `src/modules/inventory/policies/dispatch-order-lifecycle.policy.ts`
- `src/modules/inventory/policies/dispatch-sale-order.policy.ts`
- `src/modules/inventory/serializers/dispatch-order.serializer.ts`
- `src/modules/inventory/use-cases/create-dispatch-order.use-case.ts`
- `src/modules/inventory/use-cases/update-dispatch-order.use-case.ts`
- `src/modules/inventory/use-cases/add-dispatch-stop.use-case.ts`
- `src/modules/inventory/use-cases/remove-dispatch-stop.use-case.ts`
- `src/modules/inventory/use-cases/add-dispatch-expense.use-case.ts`
- `src/modules/inventory/use-cases/remove-dispatch-expense.use-case.ts`
- `src/modules/inventory/use-cases/mark-dispatch-order-dispatched.use-case.ts`
- `src/modules/inventory/use-cases/mark-dispatch-order-completed.use-case.ts`
- `src/modules/inventory/use-cases/cancel-dispatch-order.use-case.ts`
- `src/modules/inventory/use-cases/get-dispatch-order.query.use-case.ts`
- `src/modules/inventory/use-cases/get-dispatch-orders-list.query.use-case.ts`
- `src/modules/inventory/use-cases/get-dispatch-orders-cursor.query.use-case.ts`
- `src/modules/inventory/policies/warehouse-access.policy.ts`
- `src/modules/inventory/serializers/warehouse.serializer.ts`
- `src/modules/inventory/serializers/warehouse-location.serializer.ts`
- `src/modules/inventory/serializers/warehouse-stock.serializer.ts`
- `src/modules/inventory/services/warehouse-stock-projection.service.ts`
- `src/modules/inventory/use-cases/get-warehouses-list.query.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse.query.use-case.ts`
- `src/modules/inventory/use-cases/create-warehouse.use-case.ts`
- `src/modules/inventory/use-cases/update-warehouse.use-case.ts`
- `src/modules/inventory/use-cases/deactivate-warehouse.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-locations.query.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-location.query.use-case.ts`
- `src/modules/inventory/use-cases/create-warehouse-location.use-case.ts`
- `src/modules/inventory/use-cases/update-warehouse-location.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-stock.query.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-stock-cursor.query.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-stock-by-warehouse.query.use-case.ts`
- `src/modules/inventory/use-cases/get-warehouse-stock-by-warehouse-cursor.query.use-case.ts`
- `src/modules/inventory/policies/inventory-movement-access.policy.ts`
- `src/modules/inventory/policies/inventory-movement-lifecycle.policy.ts`
- `src/modules/inventory/serializers/inventory-movement.serializer.ts`
- `src/modules/inventory/use-cases/get-inventory-movements-list.query.use-case.ts`
- `src/modules/inventory/use-cases/get-inventory-movements-cursor.query.use-case.ts`
- `src/modules/inventory/use-cases/get-inventory-movements-page.query.use-case.ts`
- `src/modules/inventory/use-cases/get-inventory-movement.query.use-case.ts`
- `src/modules/inventory/use-cases/adjust-inventory.use-case.ts`
- `src/modules/inventory/use-cases/transfer-inventory.use-case.ts`
- `src/modules/inventory/use-cases/cancel-inventory-movement.use-case.ts`
- `src/modules/inventory/policies/inventory-lot-access.policy.ts`
- `src/modules/inventory/serializers/inventory-lot.serializer.ts`
- `src/modules/inventory/use-cases/get-inventory-lots-list.query.use-case.ts`
- `src/modules/inventory/use-cases/get-inventory-lots-cursor.query.use-case.ts`
- `src/modules/inventory/use-cases/get-inventory-lots-page.query.use-case.ts`
- `src/modules/inventory/use-cases/get-inventory-lot.query.use-case.ts`
- `src/modules/inventory/use-cases/create-inventory-lot.use-case.ts`
- `src/modules/inventory/use-cases/update-inventory-lot.use-case.ts`
- `src/modules/inventory/use-cases/deactivate-inventory-lot.use-case.ts`
- `src/modules/inventory/serializers/product.serializer.ts`
- `src/modules/inventory/use-cases/get-products-cursor.query.use-case.ts`
- `src/modules/inventory/policies/price-list-lifecycle.policy.ts`
- `src/modules/inventory/policies/product-price.policy.ts`
- `src/modules/inventory/policies/promotion-definition.policy.ts`
- `src/modules/inventory/policies/price-list-branch-assignment.policy.ts`
- `src/modules/inventory/policies/promotion-branch-assignment.policy.ts`
- `src/modules/inventory/serializers/price-list.serializer.ts`
- `src/modules/inventory/serializers/product-price.serializer.ts`
- `src/modules/inventory/serializers/promotion.serializer.ts`
- `src/modules/inventory/serializers/price-list-branch-assignment.serializer.ts`
- `src/modules/inventory/serializers/promotion-branch-assignment.serializer.ts`
- `src/modules/inventory/use-cases/get-price-lists-list.query.use-case.ts`
- `src/modules/inventory/use-cases/get-price-list.query.use-case.ts`
- `src/modules/inventory/use-cases/create-price-list.use-case.ts`
- `src/modules/inventory/use-cases/update-price-list.use-case.ts`
- `src/modules/inventory/use-cases/delete-price-list.use-case.ts`
- `src/modules/inventory/use-cases/get-product-prices.query.use-case.ts`
- `src/modules/inventory/use-cases/get-product-price.query.use-case.ts`
- `src/modules/inventory/use-cases/create-product-price.use-case.ts`
- `src/modules/inventory/use-cases/update-product-price.use-case.ts`
- `src/modules/inventory/use-cases/delete-product-price.use-case.ts`
- `src/modules/inventory/use-cases/get-promotions-list.query.use-case.ts`
- `src/modules/inventory/use-cases/get-promotion.query.use-case.ts`
- `src/modules/inventory/use-cases/create-promotion.use-case.ts`
- `src/modules/inventory/use-cases/update-promotion.use-case.ts`
- `src/modules/inventory/use-cases/delete-promotion.use-case.ts`
- `src/modules/inventory/use-cases/get-price-list-branch-assignments.query.use-case.ts`
- `src/modules/inventory/use-cases/get-branch-price-lists.query.use-case.ts`
- `src/modules/inventory/use-cases/get-price-list-branch-assignment.query.use-case.ts`
- `src/modules/inventory/use-cases/create-price-list-branch-assignment.use-case.ts`
- `src/modules/inventory/use-cases/update-price-list-branch-assignment.use-case.ts`
- `src/modules/inventory/use-cases/delete-price-list-branch-assignment.use-case.ts`
- `src/modules/inventory/use-cases/get-promotion-branch-assignments.query.use-case.ts`
- `src/modules/inventory/use-cases/get-branch-promotions.query.use-case.ts`
- `src/modules/inventory/use-cases/get-promotion-branch-assignment.query.use-case.ts`
- `src/modules/inventory/use-cases/create-promotion-branch-assignment.use-case.ts`
- `src/modules/inventory/use-cases/update-promotion-branch-assignment.use-case.ts`
- `src/modules/inventory/use-cases/delete-promotion-branch-assignment.use-case.ts`
- `src/modules/contacts/serializers/contact.serializer.ts`
- `src/modules/contacts/serializers/contact-branch-assignment.serializer.ts`
- `src/modules/contacts/policies/contact-lifecycle.policy.ts`
- `src/modules/contacts/policies/contact-branch-assignment.policy.ts`
- `src/modules/contacts/use-cases/get-contacts-list.query.use-case.ts`
- `src/modules/contacts/use-cases/get-contacts-page.query.use-case.ts`
- `src/modules/contacts/use-cases/get-contact.query.use-case.ts`
- `src/modules/contacts/use-cases/lookup-contact-by-identification.query.use-case.ts`
- `src/modules/contacts/use-cases/create-contact.use-case.ts`
- `src/modules/contacts/use-cases/update-contact.use-case.ts`
- `src/modules/contacts/use-cases/delete-contact.use-case.ts`
- `src/modules/contacts/use-cases/get-contact-branch-assignments.query.use-case.ts`
- `src/modules/contacts/use-cases/get-contact-branch-assignment.query.use-case.ts`
- `src/modules/contacts/use-cases/create-contact-branch-assignment.use-case.ts`
- `src/modules/contacts/use-cases/update-contact-branch-assignment.use-case.ts`
- `src/modules/contacts/use-cases/delete-contact-branch-assignment.use-case.ts`
- `src/modules/branches/serializers/branch.serializer.ts`
- `src/modules/branches/serializers/terminal.serializer.ts`
- `src/modules/branches/policies/branch-configuration.policy.ts`
- `src/modules/branches/policies/branch-lifecycle.policy.ts`
- `src/modules/branches/use-cases/get-branches-list.query.use-case.ts`
- `src/modules/branches/use-cases/get-branch.query.use-case.ts`
- `src/modules/branches/use-cases/create-branch.use-case.ts`
- `src/modules/branches/use-cases/update-branch.use-case.ts`
- `src/modules/branches/use-cases/delete-branch.use-case.ts`
- `src/modules/branches/use-cases/create-terminal.use-case.ts`
- `src/modules/branches/use-cases/get-terminal.query.use-case.ts`
- `src/modules/branches/use-cases/update-terminal.use-case.ts`
- `src/modules/branches/use-cases/delete-terminal.use-case.ts`
- `src/modules/rbac/serializers/role.serializer.ts`
- `src/modules/rbac/serializers/permission.serializer.ts`
- `src/modules/rbac/policies/role-access.policy.ts`
- `src/modules/rbac/policies/role-lifecycle.policy.ts`
- `src/modules/rbac/use-cases/get-roles-list.query.use-case.ts`
- `src/modules/rbac/use-cases/get-permissions-list.query.use-case.ts`
- `src/modules/rbac/use-cases/create-role.use-case.ts`
- `src/modules/rbac/use-cases/update-role.use-case.ts`
- `src/modules/rbac/use-cases/delete-role.use-case.ts`
- `src/modules/rbac/use-cases/assign-role-permissions.use-case.ts`
- `src/modules/platform/serializers/platform-business.serializer.ts`
- `src/modules/platform/serializers/platform-branch.serializer.ts`
- `src/modules/platform/serializers/platform-context.serializer.ts`
- `src/modules/platform/policies/platform-context.policy.ts`
- `src/modules/platform/use-cases/get-platform-businesses-list.query.use-case.ts`
- `src/modules/platform/use-cases/get-platform-business.query.use-case.ts`
- `src/modules/platform/use-cases/get-platform-business-branches.query.use-case.ts`
- `src/modules/platform/use-cases/onboard-platform-business.use-case.ts`
- `src/modules/platform/use-cases/enter-platform-business-context.use-case.ts`
- `src/modules/platform/use-cases/clear-platform-business-context.use-case.ts`

## Orden De Adopcion

1. `sales`
2. `inventory`:
   `dispatch-orders`, `warehouses`, `warehouse-stock`, `inventory-movements`,
   `inventory-lots` y `pricing` ya alineados; seguir profundizando stock
   transaccional, ledger y reservas batch
3. `contacts`, `branches`, `rbac` y `platform` ya alineados
4. profundizar infraestructura transversal y endpoints cursor-first

Se priorizan primero los modulos con mayor impacto transaccional y volumen.

## Definition Of Done Por Modulo

Un modulo se considera alineado cuando:

- expone contracts de salida claros
- tiene command y query use cases para sus flujos relevantes
- sus reglas de acceso y lifecycle viven en policies
- sus repositories filtran por tenant y usan indices razonables
- sus controllers quedan delgados
- no depende de utilitarios de serializacion duplicados
- tiene pruebas unitarias para policies y flujos criticos

## Siguiente Paso Recomendado

Luego de `sales`, `electronic-documents`, `inventory/pricing`, `contacts`,
`branches`, `rbac` y `platform`, la siguiente fase debe profundizar
infraestructura transversal y rendimiento:

- optimizacion batch de ledger, balances y reservas
- query use cases cursor-first para inventario transaccional de alto volumen
- policies explicitas para disponibilidad y asignacion cross-module
- outbox/idempotencia reusable para mas dominios
- endpoints cursor-first para consultas de alto volumen

Avance actual de esa fase:

- base reusable de idempotencia en `common`
- cursor pagination ya aterrizada en `sale-orders` y
  `electronic-documents`
- cursor pagination ya aterrizada tambien en `dispatch-orders`
- idempotencia ya aplicada a `sale-orders/:id/confirm` y
  `electronic-documents/emit`
- cursor pagination ya aterrizada tambien en `inventory-movements`,
  `inventory-lots` y `products`
- cursor pagination ya aterrizada tambien en `warehouse-stock`
- idempotencia ya aplicada tambien a `inventory-movements/:id/cancel`
- idempotencia ya aplicada tambien a `dispatch-orders/:id/dispatch`,
  `dispatch-orders/:id/complete` y `dispatch-orders/:id/cancel`
- idempotencia ya aplicada tambien a `dispatch-orders` en creacion,
  paradas y gastos
