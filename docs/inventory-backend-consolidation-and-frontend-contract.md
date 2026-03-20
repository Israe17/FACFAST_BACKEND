# Inventory Backend Consolidation And Frontend Contract

## 1. Resumen ejecutivo

Esta consolidacion dejo el modulo `inventory` en un estado mas consistente y mucho mas seguro para integracion frontend, sin cambiar la arquitectura base `controller -> service -> repository -> entity/dto`.

Se resolvio principalmente:

- Uso operativo mas cercano a `ProductVariant` como unidad real de inventario.
- Validacion estricta de `is_active` en operaciones nuevas.
- Validacion real de ownership en endpoints anidados `product -> variant` y `product -> variant -> serials`.
- Cierre del hueco de productos simples serializables via `Product.track_serials` sincronizado con el default variant.
- Contrato de movimientos unificado hacia `movement header + lines`.
- Transferencias con soporte de `location`, `inventory_lot` y `serial_ids`.
- Cancelaciones que ya revierten `inventory_balances`, `warehouse_stock`, `inventory_lot.current_quantity` y transferencias de seriales.
- Promociones que ya aceptan `product_variant_id` de forma real, no solo a nivel de schema.
- Metadata de lifecycle aditiva para que frontend sepa cuando mostrar `delete / deactivate / reactivate`.
- Eliminacion permanente segura para `ProductVariant` via endpoint explicito, sin romper el `DELETE` legacy que sigue desactivando.

Quedo parcialmente resuelto:

- El sistema ya es mucho mas variant-centric en inventario, lotes, movimientos, transferencias, seriales y promociones, pero pricing sigue anclado al path `/products/:id/prices`.
- Los seriales dejaron de estar completamente desconectados de transferencias, pero el ajuste manual de inventario sigue sin modelo serial por unidad.
- La metadata `lifecycle` ya existe en respuestas clave, pero no hay todavia un endpoint dedicado de dependencias detalladas por entidad.

Se deja como fase futura:

- Ajustes manuales serial-aware.
- Stock serial-aware al registrar seriales.
- Endpoints dedicados de `lifecycle/dependencies`.
- Endurecimiento adicional de hard delete fisico con chequeos profundos en `Product`, `Warehouse` e `InventoryLot`.

## 2. Estado final del modelo

### Product vs ProductVariant

- `Product` sigue siendo el master comercial.
- `ProductVariant` es la unidad operativa oficial para:
  - `inventory_balances`
  - `inventory_movement_lines`
  - `warehouse_stock` sync legacy
  - `inventory_lots`
  - `product_serials`
  - `promotion_items` cuando se usa `product_variant_id`
- `Product.track_serials` fue agregado para cerrar el caso de producto simple serializable.
- En productos sin variantes, `ensure_default_variant_for_product()` sincroniza:
  - `track_inventory`
  - `track_lots`
  - `track_expiration`
  - `track_serials`
  - `allow_negative_stock`
  - `is_active`

### Que ya es variant-centric

- Ajustes y transferencias pueden derivar el producto desde `product_variant_id`.
- Lotes requieren y resuelven variante operativa.
- Las lineas nuevas de movimiento guardan `product_variant_id`.
- Seriales viven sobre `product_variant_id`.
- Promociones ya pueden dirigirse a variante.

### Que sigue legacy o hibrido

- `warehouse_stock` sigue existiendo para compatibilidad legacy.
- `inventory_movements` legacy sigue recibiendo escritura por compatibilidad y trazabilidad.
- Product prices siguen expuestos desde rutas product-level.
- El registro de seriales sigue siendo trazabilidad/maestro, no incremento de stock.

### Contratos oficiales

Backend oficial recomendado para frontend:

- `GET /inventory-movements`
- `GET /inventory-movements/:id`
- `POST /inventory-movements/adjust`
- `POST /inventory-movements/transfer`
- `POST /inventory-movements/:id/cancel`
- `POST /products/:id/variants/:variantId/serials`
- `GET /products/:id/variants/:variantId/serials`
- `GET /product-serials/lookup`
- `GET /product-serials/:id/history`

Contrato recomendado:

- consumir movimientos por `movement header`
- tratar `legacy_movement_ids` y `legacy_movements` solo como compatibilidad temporal
- usar `product_variant_id` siempre que exista
- enviar `product_id` solo cuando el frontend ya lo tenga o la UI este anclada al producto padre

## 3. Lifecycle final por entidad

La metadata `lifecycle` ya aparece en respuestas serializadas principales. Es aditiva y no rompe contratos previos.

| Entidad | can_delete | can_deactivate | can_reactivate | Observacion |
|---|---:|---:|---:|---|
| Product | No | `is_active === true` | `is_active === false` | Soft lifecycle; no hard delete expuesto |
| ProductVariant | Condicional | `!is_default && is_active` | `!is_active` | `can_delete` solo si no es default, no es la ultima activa y no tiene dependencias operativas |
| Brand | Si | `is_active` | `!is_active` | Delete real bloqueado por uso al ejecutar |
| Category | Si | `is_active` | `!is_active` | Delete real bloqueado por hijos/uso |
| MeasurementUnit | Si | `is_active` | `!is_active` | Delete real bloqueado por productos/variantes |
| TaxProfile | No | `is_active` | `!is_active` | No hard delete expuesto |
| WarrantyProfile | Si | `is_active` | `!is_active` | Delete real bloqueado por uso |
| PriceList | `!is_default` | `is_active` | `!is_active` | Lista default no se elimina |
| ProductPrice | Si | `is_active` | `!is_active` | Delete fisico expuesto |
| Promotion | Si | `is_active` | `!is_active` | Delete fisico expuesto |
| Warehouse | No | `is_active` | `!is_active` | Soft lifecycle |
| WarehouseLocation | No | `is_active` | `!is_active` | Soft lifecycle |
| InventoryLot | No | `is_active` | `!is_active` | Soft lifecycle |

### Restricciones operativas vigentes

- Inactivo = no reusable en nuevas operaciones.
- Historico inactivo = sigue legible.
- Algunos `can_delete` son optimistas a nivel UI y el backend sigue validando dependencias reales al ejecutar `DELETE`.
- Para `Product`, `Warehouse`, `WarehouseLocation` e `InventoryLot`, el frontend debe mostrar `deactivate/reactivate`, no `delete`.
- Para `ProductVariant`, el frontend debe mostrar:
  - `delete permanente` solo si `lifecycle.can_delete = true`
  - `deactivate` si `lifecycle.can_delete = false` y `lifecycle.can_deactivate = true`
  - `reactivate` si `lifecycle.can_reactivate = true`

## 4. Contrato final de movimientos

### Endpoints oficiales

#### `GET /inventory-movements`

Respuesta paginada por `movement header`, ya no por lineas flatten.

Shape recomendado:

```json
{
  "data": [
    {
      "id": 120,
      "code": "MOVE-000120",
      "business_id": 1,
      "branch_id": 2,
      "movement_type": "transfer",
      "status": "posted",
      "source_document_type": "transfer_request",
      "source_document_id": 18,
      "notes": "Traslado a sucursal secundaria",
      "occurred_at": "2026-03-19T18:10:00.000Z",
      "line_count": 2,
      "lines": [
        {
          "id": 991,
          "line_no": 1,
          "warehouse": { "id": 1, "code": "WH-0001", "name": "Bodega Principal" },
          "location": { "id": 5, "code": "WL-0005", "name": "Rack A-01" },
          "inventory_lot": { "id": 10, "code": "LT-0010", "lot_number": "L-2026-0001" },
          "product_variant": { "id": 3, "sku": "SKU-001-BLK", "variant_name": "Negro" },
          "product": { "id": 1, "code": "PD-0001", "name": "Llanta 185/65 R15", "type": "product" },
          "quantity": 5,
          "on_hand_delta": -5
        }
      ],
      "legacy_movement_ids": [],
      "legacy_movements": [],
      "transferred_serial_ids": []
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 20,
  "total_pages": 1
}
```

#### `GET /inventory-movements/:id`

- Devuelve el mismo shape header-centric para una sola operacion.

#### `POST /inventory-movements/adjust`

Request:

```json
{
  "warehouse_id": 1,
  "location_id": 5,
  "product_variant_id": 3,
  "inventory_lot_id": 10,
  "movement_type": "adjustment_in",
  "quantity": 5,
  "reference_type": "inventory_lot",
  "reference_id": 10,
  "notes": "Conteo fisico"
}
```

Notas:

- `product_id` ahora es opcional si se envia `product_variant_id`.
- Si el producto tiene multiples variantes y no se envia `product_variant_id`, el backend rechaza.
- Si la variante usa lotes, `inventory_lot_id` es obligatorio.

Respuesta:

- ya devuelve `movement header` oficial
- incluye `legacy_movement_ids`
- incluye `legacy_movements` por compatibilidad temporal

#### `POST /inventory-movements/transfer`

Request:

```json
{
  "origin_warehouse_id": 1,
  "origin_location_id": 5,
  "destination_warehouse_id": 2,
  "destination_location_id": 11,
  "product_variant_id": 3,
  "inventory_lot_id": 10,
  "quantity": 2,
  "unit_cost": 12500,
  "serial_ids": [101, 102],
  "notes": "Traslado a sucursal secundaria"
}
```

Reglas:

- `product_id` es opcional si `product_variant_id` viene presente.
- Si la variante usa lotes, `inventory_lot_id` es obligatorio.
- Si la variante usa seriales, `serial_ids` es obligatorio y debe tener exactamente `quantity` elementos.
- Las lineas guardan `location_id` e `inventory_lot_id`.
- Si el lote existe en origen, el backend decrementa origen y crea o reutiliza lote espejo en destino por `(warehouse, product, variant, lot_number)`.

Respuesta:

- devuelve `movement header` oficial
- expone `legacy_movement_ids`
- expone `transferred_serial_ids`

#### `POST /inventory-movements/:id/cancel`

- Cancela via movimiento compensatorio.
- Revierte:
  - `inventory_balances`
  - `warehouse_stock`
  - `inventory_lot.current_quantity`
  - transferencias de seriales asociadas al header original
  - historial legacy de movimientos compensatorios

Response:

```json
{
  "success": true,
  "cancelled_movement": { "...": "movement header original" },
  "compensating_movement": { "...": "movement header compensatorio" }
}
```

## 4.1 Contrato oficial de variantes para frontend

### `DELETE /products/:id/variants/:variantId`

- Este endpoint sigue siendo **desactivacion**, no hard delete.
- Response: `ProductVariant` serializada con `is_active = false`.
- Frontend debe usarlo cuando:
  - `lifecycle.can_delete = false`
  - `lifecycle.can_deactivate = true`

### `DELETE /products/:id/variants/:variantId/permanent`

- Este endpoint es el contrato oficial para **eliminacion fisica segura**.
- Solo elimina si la variante esta completamente limpia.
- Response:

```json
{
  "id": 15,
  "deleted": true
}
```

- Frontend debe usarlo solo cuando `lifecycle.can_delete = true`.
- Si no se puede eliminar, el backend responde:
  - `code = PRODUCT_VARIANT_DELETE_FORBIDDEN`
  - `details.reasons`
  - `details.dependencies`

Shape esperada del bloqueo:

```json
{
  "statusCode": 400,
  "code": "PRODUCT_VARIANT_DELETE_FORBIDDEN",
  "messageKey": "inventory.product_variant_delete_forbidden",
  "details": {
    "variant_id": 15,
    "reasons": [
      "inventory_movement_lines",
      "product_serials"
    ],
    "dependencies": {
      "inventory_balances": 0,
      "inventory_movement_lines": 3,
      "inventory_movements": 0,
      "inventory_lots": 0,
      "product_prices": 0,
      "product_serials": 2,
      "promotion_items": 0,
      "warehouse_stock": 0
    }
  }
}
```

### Reglas exactas de `ProductVariant.lifecycle`

- `can_delete = true` solo cuando:
  - no es `is_default`
  - no es la ultima variante activa del producto
  - no tiene dependencias en:
    - `inventory_balances`
    - `inventory_movement_lines`
    - `inventory_movements`
    - `inventory_lots`
    - `product_prices`
    - `product_serials`
    - `promotion_items`
    - `warehouse_stock`
- `can_deactivate = true` cuando:
  - `is_active = true`
  - `is_default = false`
  - no es la ultima activa
- `can_reactivate = true` cuando `is_active = false`

### IDs validos

- `movement_id` en movimientos = siempre `inventory_movement_headers.id`
- `legacy_movement_ids` = ids de `inventory_movements` legacy
- `line.id` = `inventory_movement_lines.id`

### Compatibilidad legacy

- `inventory_movements` legacy sigue alimentandose.
- Frontend nuevo no debe basarse en el shape legacy como contrato principal.
- Si una integracion heredada necesita soporte temporal, debe usar `legacy_movement_ids` o `legacy_movements`.

## 5. Lotes y seriales

### Lotes

Resuelto:

- `inventory_lot_id` ya se guarda en `inventory_movement_lines`.
- Transferencias con lotes ya mantienen cantidades origen/destino.
- Cancelaciones ya revierten `InventoryLot.current_quantity`.
- `location_id` tambien queda guardado por linea.

Reglas frontend:

- Si `track_lots = true`, no intentes crear transferencias o ajustes sin lote.
- Si el frontend conoce la ubicacion fisica, envia `location_id` en ajustes y `origin_location_id / destination_location_id` en transferencias.
- En transferencias de lotes, el destino puede reutilizar un lote existente con el mismo `lot_number`.

Limitaciones vigentes:

- No existe aun un flujo especializado de merge/split de lotes.
- La ubicacion de lote en destino sigue siendo una sola fila por lote, no multiples sub-ubicaciones.

### Seriales

Resuelto:

- Registro masivo de seriales ahora es transaccional.
- Endpoints anidados validan ownership real de `variantId` contra `productId`.
- Transferencias con seriales ya actualizan `warehouse_id` por serial y generan `serial_events`.
- Cancelacion de una transferencia revierte el warehouse de los seriales afectados.
- Cambio de estado de serial limpia `sold_at` cuando el estado deja de ser `sold`.

Limitaciones vigentes:

- Registrar seriales no incrementa stock.
- Ajustes manuales siguen siendo stock-centric, no serial-centric.
- No existe aun seleccion por serial para ajustes de salida/entrada.

Recomendacion frontend:

- usa registro de seriales para trazabilidad/recepcion documental
- usa transferencias con `serial_ids` para movimientos fisicos entre bodegas
- evita usar ajuste manual como mecanismo principal para variantes serializadas hasta la fase 2

## 6. Validaciones operativas

### Entidades que ya no se pueden usar inactivas en operaciones nuevas

- Product
- ProductVariant
- PriceList
- Warehouse
- WarehouseLocation
- InventoryLot
- Category cuando se referencia desde product
- Brand cuando se referencia desde product
- MeasurementUnit cuando se referencia desde product o variant
- TaxProfile cuando se referencia desde product o variant
- WarrantyProfile cuando se referencia desde product o variant

### Errores relevantes que frontend debe esperar

- `PRODUCT_INACTIVE`
- `VARIANT_INACTIVE`
- `WAREHOUSE_INACTIVE`
- `WAREHOUSE_LOCATION_INACTIVE`
- `INVENTORY_LOT_INACTIVE`
- `PRICE_LIST_INACTIVE`
- `CATEGORY_INACTIVE`
- `BRAND_INACTIVE`
- `MEASUREMENT_UNIT_INACTIVE`
- `TAX_PROFILE_INACTIVE`
- `WARRANTY_PROFILE_INACTIVE`
- `VARIANT_PRODUCT_MISMATCH`
- `PRODUCT_OR_VARIANT_REQUIRED`
- `INVENTORY_LOT_REQUIRED`
- `INVENTORY_LOT_VARIANT_MISMATCH`
- `SERIALS_REQUIRED_FOR_SERIAL_TRACKED_VARIANT`
- `SERIAL_TRANSFER_QUANTITY_MISMATCH`
- `SERIAL_STATUS_NOT_TRANSFERABLE`
- `PROMOTION_PRODUCT_OR_VARIANT_REQUIRED`

### Reglas UI

- Si una referencia esta inactiva, no debe ofrecerse en selectores para operaciones nuevas.
- Si una respuesta incluye `lifecycle.can_reactivate = true`, la UI puede ofrecer accion de reactivacion via `PATCH is_active=true`.
- Si `lifecycle.can_delete = false`, la UI debe ocultar `delete` y priorizar `deactivate`.

## 7. Seguridad y multi-tenant

- Todas las resoluciones operativas siguen ancladas a `business_id`.
- Las bodegas, ubicaciones, lotes y seriales validan acceso por branch a traves del contexto del usuario.
- Las rutas anidadas ahora validan que la variante realmente pertenezca al producto del path.
- Serial lookup e historial verifican branch access del warehouse actual del serial.
- Cancelaciones y transferencias validan tenant consistency entre branch, warehouse y variant.

Assumptions seguras para frontend:

- si el backend devuelve un id operativo, pertenece al tenant resuelto en el token/contexto actual
- no se puede operar inventario cruzando negocios
- no se puede transferir stock desde una bodega inaccesible aunque el id exista

## 8. Indices, constraints y notas tecnicas

Cambios tecnicos relevantes:

- `inventory_movement_lines`
  - nuevas columnas: `location_id`, `inventory_lot_id`
  - nuevos indices para consultas por `warehouse + variant`, `inventory_lot_id`, `location_id`
- `products`
  - nueva columna: `track_serials`
- `promotion_items`
  - ya queda usado de verdad `product_variant_id`
- `inventory_movement_headers` paginados
  - query con `distinct(true)` para evitar duplicados por joins
- `inventory_lots`
  - validacion de unicidad corregida para manejar `product_variant_id = null`

Impacto esperado:

- mejor reversibilidad de movimientos
- mejor trazabilidad de lotes
- menor ambiguedad en integracion frontend
- menor riesgo de operar entidades inactivas o mal anidadas

## 9. Lista completa de archivos modificados

### Cambios funcionales principales

| Archivo | Cambio | Motivo |
|---|---|---|
| `src/modules/inventory/services/inventory-validation.service.ts` | validaciones `is_active`, ownership y reglas de variante | endurecer operaciones nuevas |
| `src/modules/inventory/services/products.service.ts` | soporte `track_serials`, lifecycle metadata | cerrar producto simple serializable |
| `src/modules/inventory/services/product-variants.service.ts` | resolver `product + variant`, sync default variant, lifecycle metadata | consolidar variant-centric |
| `src/modules/inventory/services/product-variants.service.ts` | hard delete seguro por dependencias + `lifecycle.can_delete` real | permitir eliminacion permanente sin romper contratos previos |
| `src/modules/inventory/services/inventory-adjustments.service.ts` | producto opcional por variante, lot/location context en ledger | consistencia operativa |
| `src/modules/inventory/services/inventory-transfers.service.ts` | transferencias con lote, ubicacion, seriales, legacy codes | cerrar gap critico de transferencias |
| `src/modules/inventory/services/inventory-movements.service.ts` | contrato header-centric, cancelacion mas completa | unificar movimientos |
| `src/modules/inventory/services/inventory-ledger.service.ts` | lineas con `location` y `inventory_lot` | trazabilidad y reversibilidad |
| `src/modules/inventory/services/product-serials.service.ts` | transaccion, access control, status cleanup | consolidar seriales |
| `src/modules/inventory/services/inventory-lots.service.ts` | lot create/update variant-centric, fixes de duplicado y expiracion | consistencia de lotes |
| `src/modules/inventory/services/pricing.service.ts` | enforcement de referencias activas, lifecycle metadata | pricing mas seguro |
| `src/modules/inventory/services/promotions.service.ts` | soporte real a `product_variant_id`, lifecycle metadata | cerrar promotion gap |
| `src/modules/inventory/services/warehouses.service.ts` | soporte `purpose`, lifecycle metadata | consistencia warehouse |
| `src/modules/inventory/services/variant-attributes.service.ts` | variantes generadas heredan `track_serials` e `is_active` | coherencia de variantes |
| `src/modules/inventory/controllers/inventory-movements.controller.ts` | nuevo `GET /inventory-movements/:id` | detalle oficial por header |
| `src/modules/inventory/controllers/product-serials.controller.ts` | validacion de ownership por path y nuevas firmas | seguridad y consistencia |
| `src/modules/inventory/controllers/product-variants.controller.ts` | validacion de ownership por path + endpoint `DELETE .../permanent` | cerrar huecos nested routes y habilitar hard delete seguro |
| `src/modules/inventory/dto/create-inventory-adjustment.dto.ts` | `product_id` opcional | variant-centric compat |
| `src/modules/inventory/dto/create-inventory-transfer.dto.ts` | `product_id` opcional, lot/location/serial fields | transferencias completas |
| `src/modules/inventory/dto/create-inventory-lot.dto.ts` | `product_id` opcional | lotes variant-centric |
| `src/modules/inventory/dto/create-product.dto.ts` | `track_serials` | producto simple serializable |
| `src/modules/inventory/dto/update-product.dto.ts` | `track_serials` | producto simple serializable |
| `src/modules/inventory/dto/create-promotion-item.dto.ts` | `product_variant_id` y `product_id` opcional | promociones por variante |
| `src/modules/inventory/dto/create-warehouse.dto.ts` | `purpose` | exponer campo de entidad |
| `src/modules/inventory/dto/update-warehouse.dto.ts` | `purpose` | exponer campo de entidad |
| `src/modules/inventory/entities/product.entity.ts` | nueva columna `track_serials` | sync con default variant |
| `src/modules/inventory/entities/inventory-movement-line.entity.ts` | nuevas columnas/relaciones `location_id`, `inventory_lot_id` + indices | ledger con contexto suficiente |
| `src/modules/inventory/repositories/inventory-movement-headers.repository.ts` | joins/relations nuevas y `distinct(true)` | headers completos y paginacion estable |
| `src/modules/inventory/repositories/inventory-movement-lines.repository.ts` | relaciones nuevas | lectura completa de lineas |
| `src/modules/inventory/repositories/inventory-lots.repository.ts` | unicidad corregida por variante nullable | evitar falsos duplicados |
| `src/modules/inventory/repositories/product-serials.repository.ts` | lectura por ids y relaciones completas | transfer/cancel seriales |
| `src/modules/inventory/repositories/promotions.repository.ts` | carga `product_variant` | serializacion de promociones |
| `src/modules/inventory/repositories/product-variants.repository.ts` | soporte `remove()` | eliminacion fisica segura |
| `src/modules/inventory/repositories/inventory-balances.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/inventory-movement-lines.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/inventory-movements.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/inventory-lots.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/product-prices.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/product-serials.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/promotions.repository.ts` | conteo de items por variante | lifecycle/dependencias de borrado |
| `src/modules/inventory/repositories/warehouse-stock.repository.ts` | conteo por variante | lifecycle/dependencias de borrado |
| `src/modules/common/i18n/error-translations.ts` | traduccion de `PRODUCT_VARIANT_DELETE_FORBIDDEN` | error de negocio claro para frontend |

### Ajustes de serializacion / lifecycle

| Archivo | Cambio | Motivo |
|---|---|---|
| `src/modules/inventory/services/brands.service.ts` | metadata `lifecycle` | frontend actions claras |
| `src/modules/inventory/services/product-categories.service.ts` | metadata `lifecycle` | frontend actions claras |
| `src/modules/inventory/services/measurement-units.service.ts` | metadata `lifecycle` | frontend actions claras |
| `src/modules/inventory/services/tax-profiles.service.ts` | metadata `lifecycle` | frontend actions claras |
| `src/modules/inventory/services/warranty-profiles.service.ts` | metadata `lifecycle` | frontend actions claras |
| `src/modules/inventory/services/inventory-lots.service.ts` | metadata `lifecycle` | frontend actions claras |
| `src/modules/inventory/services/warehouses.service.ts` | metadata `lifecycle` | frontend actions claras |

### Formato / soporte tecnico

| Archivo | Cambio | Motivo |
|---|---|---|
| `src/modules/common/services/entity-code.service.spec.ts` | ajuste menor de lint | dejar repo en verde |
| `src/modules/contacts/controllers/contacts.controller.ts` | autofix de lint/formato | mantenimiento tecnico |
| `src/modules/contacts/services/contacts.service.ts` | autofix de lint/formato | mantenimiento tecnico |
| `src/modules/inventory/controllers/variant-attributes.controller.ts` | autofix de lint/formato | mantenimiento tecnico |
| `src/modules/inventory/entities/inventory-lot.entity.ts` | formato | mantenimiento tecnico |
| `src/modules/inventory/entities/product-price.entity.ts` | formato | mantenimiento tecnico |
| `src/modules/inventory/repositories/inventory-balances.repository.ts` | formato | mantenimiento tecnico |
| `src/modules/inventory/repositories/products.repository.ts` | cleanup de import | lint |
| `src/modules/inventory/repositories/warehouses.repository.ts` | formato | mantenimiento tecnico |
| `src/modules/inventory/services/warehouse-stock.service.ts` | formato | mantenimiento tecnico |

## 10. Guia para frontend - armonia total

### Endpoints a usar

Usar como oficiales:

- `GET /products`
- `GET /products/:id`
- `GET /products/:id/variants`
- `GET /products/:id/variants/:variantId`
- `DELETE /products/:id/variants/:variantId`
- `DELETE /products/:id/variants/:variantId/permanent`
- `POST /products/:id/variants/:variantId/serials`
- `GET /products/:id/variants/:variantId/serials`
- `GET /product-serials/lookup`
- `GET /product-serials/:id/history`
- `POST /inventory-lots`
- `POST /inventory-movements/adjust`
- `POST /inventory-movements/transfer`
- `GET /inventory-movements`
- `GET /inventory-movements/:id`
- `POST /inventory-movements/:id/cancel`

### Endpoints o contratos a evitar como primarios

- No consumir `inventory_movements` legacy como fuente primaria.
- No asumir que `POST /inventory-movements/adjust` devuelve un movimiento legacy; ahora devuelve header oficial.
- No asumir que promociones son solo product-level.

### Campos nuevos o estandarizados

- `product.track_serials`
- `movement.lines[].location`
- `movement.lines[].inventory_lot`
- `movement.legacy_movement_ids`
- `movement.legacy_movements`
- `movement.transferred_serial_ids`
- `entity.lifecycle`
- `warehouse.purpose`

### Active / inactive

- `is_active = false` significa:
  - no reusable en nuevas operaciones
  - si es historico, aun se puede leer
- La UI debe filtrar selects operativos por activos.

### Delete / deactivate / reactivate

- usar `lifecycle.can_delete`, `can_deactivate`, `can_reactivate`
- si `can_delete = false`, mostrar solo `deactivate` o `reactivate`
- para variantes:
  - `DELETE /products/:id/variants/:variantId` = desactivar
  - `DELETE /products/:id/variants/:variantId/permanent` = eliminar fisicamente
- para `Brand`, `Category`, `MeasurementUnit`, `WarrantyProfile`, `PriceList`, `ProductPrice`, `Promotion`, el backend sigue revalidando dependencias aunque UI muestre delete

### Productos simples vs multivariantes

- Producto simple:
  - existe un default variant sincronizado
  - `track_serials` se configura desde el producto
  - las operaciones pueden mandar solo `product_variant_id`
- Producto multivariante:
  - siempre enviar `product_variant_id` en operaciones de stock
  - no asumir que `product_id` alcanza

### Serializacion

- Para variantes serializadas, las transferencias deben enviar `serial_ids`.
- La UI no debe asumir que registrar seriales incrementa stock.
- Lookup e historial de serial dependen del warehouse actual para access control.

### Lotes

- Si la variante usa lotes:
  - siempre enviar `inventory_lot_id` en ajustes/transferencias
  - enviar ubicaciones si la UI las conoce
- En transferencias, el lote de destino puede crearse automaticamente.

### Movimientos

- Consumir `GET /inventory-movements` como listado principal.
- Renderizar por header con nested lines.
- Usar `GET /inventory-movements/:id` para detalle completo.
- Para cancelaciones, trabajar siempre con `movement.id` del header.

### Edge cases que frontend debe contemplar

- una variante puede estar inactiva aunque el producto exista
- un producto simple serializable depende del default variant sincronizado
- una transferencia con lote puede crear lote espejo en destino
- promociones pueden venir con `product_variant = null` o con `product_variant` poblado
- `legacy_movement_ids` puede estar vacio en listados normales y poblado en respuestas POST

### Que no debe asumir frontend

- no asumir que `product_id` siempre es obligatorio
- no asumir que un id legacy sirve para cancelar movimientos
- no asumir que un serial registrado implica stock disponible
- no asumir que `delete` siempre esta permitido aunque exista endpoint
- no asumir que el `DELETE` de variante elimina fisicamente; el hard delete vive en `/permanent`

## 11. Proximos pasos recomendados

### Backlog fase 2

1. Ajustes serial-aware:
   - seleccionar seriales en ajuste in/out
   - generar `serial_events` por ajuste
2. Registro de seriales con opcion de recepcion operativa:
   - registrar serial + movimiento de entrada controlado
3. Endpoint dedicado de `lifecycle/dependencies`:
   - `can_delete`
   - `can_deactivate`
   - `can_reactivate`
   - `reasons`
   - `dependencies`
4. Hard delete seguro para entidades criticas:
   - `Product`
   - `ProductVariant`
   - `Warehouse`
   - `InventoryLot`
5. Pricing 100% variant-centric:
   - vistas/consultas por variante
   - endpoint directo por target operativo

### Refactors mayores que conviene separar

- retirada completa del write legacy `inventory_movements`
- retirada completa del sync a `warehouse_stock`
- endpoint formal de stock serializado por unidad
- flujos de recepcion/dispatch/reserva sobre buckets del ledger nuevo

## Estado final recomendado para frontend

Frontend puede integrar desde ya con buena armonia si sigue estas reglas:

- usar `ProductVariant` como unidad operativa
- consumir movimientos por `header + lines`
- respetar `is_active` y `lifecycle`
- tratar lotes y seriales como restricciones reales del producto/variante
- usar campos de compatibilidad legacy solo como fallback temporal
