# Sale Order Reservation Architecture

## Objetivo

Esta refactorizacion mueve la confirmacion de ordenes de venta desde un flujo
CRUD con side effects acoplados hacia un flujo estructural basado en:

- politicas de dominio para acceso, ciclo de vida y disponibilidad
- casos de uso dedicados para confirmar y cancelar
- reservas de inventario explicitas como fuente de verdad operativa
- ledger de inventario como auditoria y proyeccion, no como unica regla de negocio

## Cambios Principales

### 1. Nueva entidad de reservas

Se agrego `inventory_reservations` como modelo operativo para reservas por linea
de orden:

- archivo: `src/modules/inventory/entities/inventory-reservation.entity.ts`
- estado: `active`, `consumed`, `released`
- granularidad: una reserva por `sale_order_line_id + warehouse_id`
- constraint unico:
  `business_id + sale_order_line_id + warehouse_id`

Campos clave:

- `sale_order_id`
- `sale_order_line_id`
- `warehouse_id`
- `product_variant_id`
- `reserved_quantity`
- `consumed_quantity`
- `released_quantity`
- `status`
- `created_by_user_id`
- `released_by_user_id`
- `consumed_by_user_id`

### 2. Nueva capa de servicios de reservas

Se agrego `InventoryReservationsService`:

- archivo: `src/modules/inventory/services/inventory-reservations.service.ts`

Responsabilidades:

- crear reservas al confirmar una orden
- liberar reservas al cancelar
- consumir reservas al despachar
- bloquear filas de reservas por orden con `pessimistic_write`

### 3. Politicas de dominio en ventas

Se agregaron estas politicas:

- `SaleOrderAccessPolicy`
- `SaleOrderLifecyclePolicy`
- `SaleOrderInventoryPolicy`

Archivos:

- `src/modules/sales/policies/sale-order-access.policy.ts`
- `src/modules/sales/policies/sale-order-lifecycle.policy.ts`
- `src/modules/sales/policies/sale-order-inventory.policy.ts`

Responsabilidades:

- acceso por sucursal sobre ordenes de venta
- transiciones validas de estado
- validacion de bodega habilitada, consistencia tenant y stock disponible

### 4. Casos de uso dedicados

Se agregaron:

- `CreateSaleOrderUseCase`
- `UpdateSaleOrderUseCase`
- `ConfirmSaleOrderUseCase`
- `CancelSaleOrderUseCase`
- `DeleteSaleOrderUseCase`

Archivos:

- `src/modules/sales/use-cases/create-sale-order.use-case.ts`
- `src/modules/sales/use-cases/update-sale-order.use-case.ts`
- `src/modules/sales/use-cases/confirm-sale-order.use-case.ts`
- `src/modules/sales/use-cases/cancel-sale-order.use-case.ts`
- `src/modules/sales/use-cases/delete-sale-order.use-case.ts`

Responsabilidades:

- crear, actualizar y eliminar borradores con reglas del dominio
- cargar la orden con lock pesimista
- validar acceso y lifecycle
- reservar o liberar inventario
- registrar movimiento en ledger
- persistir estado final de la orden

### 5. SaleOrdersService mas delgado

`SaleOrdersService` ahora:

- delega create, update y delete a casos de uso
- delega confirmacion y cancelacion a casos de uso
- delega lecturas a query use cases
- queda como fachada delgada del modulo

Archivo:

- `src/modules/sales/services/sale-orders.service.ts`

### 6. Despacho consume reservas

`DispatchOrdersService` ahora:

- solo acepta ordenes confirmadas para crear stops
- exige que la orden y el despacho pertenezcan a la misma sucursal
- consume reservas antes de postear el despacho
- actualiza `dispatch_status` de la orden de venta

Archivo:

- `src/modules/inventory/services/dispatch-orders.service.ts`

## Flujo Nuevo

### Confirmar orden

1. Se carga la orden con lock pesimista.
2. Se valida acceso por sucursal.
3. Se valida que la orden siga en `DRAFT`.
4. Se valida bodega permitida y stock disponible.
5. Se crean reservas por linea trackeable.
6. Se cambia la orden a `CONFIRMED`.
7. Se registra un movimiento `SALES_ALLOCATED` en el ledger.

### Cancelar orden

1. Se carga la orden con lock pesimista.
2. Se valida acceso por sucursal.
3. Se valida que no este ya cancelada.
4. Se liberan las reservas pendientes.
5. Se cambia la orden a `CANCELLED`.
6. Si habia reserva activa, se registra `RELEASE` en el ledger.

### Despachar orden

1. Se carga cada orden de venta del stop con lock pesimista.
2. Se valida que este confirmada y con bodega.
3. Se consumen sus reservas.
4. Se actualiza `dispatch_status` a `DISPATCHED`.
5. Se registra `SALES_DISPATCH` con `on_hand_delta` y `reserved_delta`.

## Garantias que ahora si existen

- una orden ya no puede reservar dos veces sin caer en lock o constraint
- la confirmacion ya no ignora el scope de sucursal
- la confirmacion valida disponibilidad antes de reservar
- el despacho ya no asume reservas implcitas
- el ledger sigue reflejando el cambio, pero la reserva ya no depende solo del ledger

## Archivos Nuevos o Clave

- `src/modules/inventory/entities/inventory-reservation.entity.ts`
- `src/modules/inventory/enums/inventory-reservation-status.enum.ts`
- `src/modules/inventory/repositories/inventory-reservations.repository.ts`
- `src/modules/inventory/services/inventory-reservations.service.ts`
- `src/modules/sales/policies/sale-order-access.policy.ts`
- `src/modules/sales/policies/sale-order-lifecycle.policy.ts`
- `src/modules/sales/policies/sale-order-mode.policy.ts`
- `src/modules/sales/use-cases/create-sale-order.use-case.ts`
- `src/modules/sales/use-cases/update-sale-order.use-case.ts`
- `src/modules/sales/policies/sale-order-inventory.policy.ts`
- `src/modules/sales/use-cases/confirm-sale-order.use-case.ts`
- `src/modules/sales/use-cases/cancel-sale-order.use-case.ts`
- `src/modules/sales/use-cases/delete-sale-order.use-case.ts`
- `src/modules/sales/serializers/sale-order.serializer.ts`
- `src/modules/sales/use-cases/get-sale-order.query.use-case.ts`
- `src/modules/sales/use-cases/get-sale-orders-list.query.use-case.ts`
- `src/modules/sales/use-cases/get-sale-orders-page.query.use-case.ts`

## Consideraciones Operativas

En este repo la base se levanta con `DB_SYNCHRONIZE=true` por defecto. Por eso la
nueva tabla se crea automaticamente en ambientes donde esa opcion sigue activa.

Si un ambiente usa `DB_SYNCHRONIZE=false`, hace falta agregar una migracion que
cree `inventory_reservations` con sus indices antes de desplegar este cambio.

## Siguientes Mejoras Recomendadas

1. Crear migracion formal para `inventory_reservations`.
2. Mover `dispatch_status` a un workflow mas explicito por stop o por fulfillment.
3. Agregar pruebas de integracion de concurrencia con `pg-mem` o Postgres real.
4. Exponer reservas en consultas de orden para observabilidad operativa.
