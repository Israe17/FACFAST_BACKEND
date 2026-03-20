# Pricing Comercial Actual - Contrato Real Backend -> Frontend

## 1. Objetivo

Este documento aclara el estado real del backend de pricing/comercial en la
etapa actual, para que frontend se alinee sin asumir capacidades que todavia
no existen.

Esta guia esta basada en el codigo real de:

- `PricingService`
- `PromotionsService`
- controllers, DTOs, entidades y repositories de `price_lists`,
  `product_prices` y `promotions`

## 2. Resumen Ejecutivo

Hoy el backend comercial funciona asi:

1. Las `price_lists` existen como catalogo **business-wide**.
2. Los `product_prices` se gestionan publicamente **desde el producto**:
   - `GET /products/:id/prices`
   - `POST /products/:id/prices`
3. El modelo de datos **tolera** `product_variant_id`, pero el contrato publico
   sigue estando anclado al `product_id`.
4. No existe una capa expuesta de:
   - assignments
   - scopes comerciales avanzados
   - reglas por cliente
   - reglas por segmento
   - reglas por sucursal
   - motor de "effective price"
5. `promotions` es un modulo separado. No esta unido a `price_lists`.
6. Si frontend quiere mostrar "promociones relacionadas con una lista de
   precios", esa relacion hoy se **infiere en frontend** cruzando productos o
   variantes; el backend no expone esa vista agregada.

## 3. Lo Que Si Existe Hoy

### 3.1 Price Lists

Backend expone:

- `GET /price-lists`
- `POST /price-lists`
- `GET /price-lists/:id`
- `PATCH /price-lists/:id`
- `DELETE /price-lists/:id`

Campos reales de una lista:

- `id`
- `code`
- `business_id`
- `name`
- `kind`
- `currency`
- `is_default`
- `is_active`
- `lifecycle`
- `created_at`
- `updated_at`

Notas reales:

- son listas por empresa, no por sucursal ni por segmento
- `kind` es solo clasificatorio (`retail`, `wholesale`, `credit`, `special`)
- no existe campo backend para assignment comercial
- no existe campo backend para scope comercial aplicado
- no existe endpoint para asignar la lista a clientes, branches o canales

### 3.2 Product Prices

Backend expone:

- `GET /products/:id/prices`
- `POST /products/:id/prices`
- `PATCH /product-prices/:id`
- `DELETE /product-prices/:id`

Campos reales de un precio:

- `id`
- `business_id`
- `product_id`
- `product_variant` nullable
- `price_list`
- `price`
- `min_quantity`
- `valid_from`
- `valid_to`
- `is_active`
- `lifecycle`
- `created_at`
- `updated_at`

Notas reales:

- el endpoint publico siempre cuelga del `product_id`
- no existe `GET /product-prices/:id`
- no existe `GET /variants/:id/prices`
- no existe `GET /price-lists/:id/prices`
- no existe endpoint de "effective price resolution"
- no existe endpoint que filtre precios por fecha efectiva
- no existe endpoint que aplique `min_quantity` ni seleccione el mejor precio

### 3.3 Promotions

Backend expone:

- `GET /promotions`
- `POST /promotions`
- `GET /promotions/:id`
- `PATCH /promotions/:id`
- `DELETE /promotions/:id`

Una promocion contiene:

- metadatos de la promocion
- `items[]`
- cada item puede apuntar a:
  - `product`
  - `product_variant` nullable

Notas reales:

- promotions no depende de price lists
- promotions no tiene assignment comercial
- promotions no resuelve "aplicable a esta lista"
- promotions no calcula "precio final comercial"

## 4. Lo Que NO Existe Aun

Esto no esta expuesto hoy en backend:

- price list assignments
- scopes comerciales persistidos
- vinculo lista -> cliente
- vinculo lista -> segmento
- vinculo lista -> branch
- vinculo lista -> warehouse
- vinculo lista -> canal
- pricing engine para resolver precio efectivo
- pricing engine que combine precio + promocion
- consulta backend "dame todas las promociones de esta lista"
- consulta backend "dame el precio final vigente de este producto"

## 5. Realidad De Product-Level vs Variant-Level

### 5.1 Lo que es oficial hoy

Para frontend, el contrato oficial actual debe considerarse:

- la gestion de precios sigue siendo **product-level en su entrada publica**
- el `product_id` es el ancla oficial de lectura/creacion
- `product_variant_id` existe como refinamiento opcional dentro del producto

### 5.2 Lo que NO debe asumir frontend

Frontend no debe asumir que hoy existe un pricing module totalmente
variant-centric, porque no es cierto.

Aunque el backend soporta `product_variant_id` en `product_prices`:

- la lista sigue saliendo por producto
- la creacion sigue entrando por producto
- la edicion sigue usando `product_price_id`, no una ruta de variante

### 5.3 Regla recomendada para frontend

En esta fase:

- manejar precios desde la pantalla del producto
- dentro de esa pantalla, permitir que una fila de precio sea:
  - general al producto
  - especifica para una variante del mismo producto
- no construir un modulo separado de "pricing por variante" como flujo oficial
  independiente, salvo que siga colgado del producto padre

## 6. Contrato Exacto De Endpoints

### 6.1 `GET /price-lists`

Devuelve un arreglo simple de listas, no paginado.

Shape real:

```json
[
  {
    "id": 1,
    "code": "PL-0001",
    "business_id": 7,
    "name": "Precio Retail",
    "kind": "retail",
    "currency": "CRC",
    "is_default": true,
    "is_active": true,
    "lifecycle": {
      "can_delete": false,
      "can_deactivate": true,
      "can_reactivate": false,
      "reasons": ["default_price_list"]
    },
    "created_at": "...",
    "updated_at": "..."
  }
]
```

Frontend debe considerar source of truth:

- `id`
- `name`
- `kind`
- `currency`
- `is_default`
- `is_active`
- `lifecycle`

### 6.2 `POST /price-lists`

Request real:

```json
{
  "code": "PL-0002",
  "name": "Mayorista",
  "kind": "wholesale",
  "currency": "CRC",
  "is_default": false,
  "is_active": true
}
```

No acepta:

- `scope_level`
- `branch_id`
- `segment_id`
- `customer_group_id`
- `assignment_rules`

### 6.3 `PATCH /price-lists/:id`

Permite cambiar:

- `code`
- `name`
- `kind`
- `currency`
- `is_default`
- `is_active`

No permite configurar scopes ni assignments.

### 6.4 `DELETE /price-lists/:id`

Comportamiento real:

- si la lista es default, backend bloquea delete
- si no es default, backend:
  - borra todos los `product_prices` de esa lista
  - luego borra la `price_list`

Implicacion frontend:

- delete de lista no es "archive"
- es hard delete real
- eliminar una lista tambien elimina sus precios

### 6.5 `GET /products/:id/prices`

Devuelve todas las filas de precios del producto en esa empresa.

Shape real de cada fila:

```json
{
  "id": 15,
  "business_id": 7,
  "product_id": 22,
  "product_variant": {
    "id": 90,
    "sku": "CAM-NEG-M",
    "variant_name": "Negro / M",
    "is_default": false
  },
  "price_list": {
    "id": 3,
    "code": "PL-0003",
    "name": "Retail",
    "kind": "retail",
    "currency": "CRC"
  },
  "price": 12500,
  "min_quantity": 1,
  "valid_from": null,
  "valid_to": null,
  "is_active": true,
  "lifecycle": {
    "can_delete": true,
    "can_deactivate": true,
    "can_reactivate": false,
    "reasons": []
  },
  "created_at": "...",
  "updated_at": "..."
}
```

Importante:

- la fila no serializa `product_variant_id` plano
- frontend debe leerlo desde `product_variant?.id`
- una fila con `product_variant = null` significa precio general al producto

### 6.6 `POST /products/:id/prices`

Request real:

```json
{
  "product_variant_id": 90,
  "price_list_id": 3,
  "price": 12500,
  "min_quantity": 1,
  "valid_from": null,
  "valid_to": null,
  "is_active": true
}
```

Reglas reales:

- `price_list_id` obligatorio
- `price` obligatorio
- `product_variant_id` opcional
- si viene `product_variant_id`, backend valida que pertenezca al producto del
  path
- si no viene `product_variant_id`, la fila queda a nivel producto

### 6.7 `PATCH /product-prices/:id`

Permite cambiar:

- `product_variant_id`
- `price_list_id`
- `price`
- `min_quantity`
- `valid_from`
- `valid_to`
- `is_active`

Importante para frontend:

- una fila se puede mover entre "precio general" y "precio por variante"
- pero siempre dentro del mismo `product_id` ya persistido

### 6.8 `DELETE /product-prices/:id`

Comportamiento real:

- hard delete simple de la fila
- no archive
- no soft delete

## 7. Reglas Reales De Unicidad Y Solapamiento

La tabla `product_prices` hoy tiene unicidad por:

- `product_id`
- `product_variant_id`
- `price_list_id`
- `min_quantity`

Eso significa:

- no puede haber dos filas iguales con esa combinacion exacta
- pero el backend no resuelve "precio ganador"
- y frontend no debe asumir que existe logica avanzada de priorizacion

El backend solo valida rango de fechas:

- `valid_to` no puede ser menor que `valid_from`

No hay validacion avanzada de:

- solapamiento comercial entre periodos
- prioridad entre precio general y precio de variante
- prioridad entre min_quantity diferentes
- precio vigente "actual" calculado por backend

## 8. Relacion Real Con Promociones

### 8.1 Lo que SI existe

Promotions puede apuntar a:

- un producto
- o una variante

Cada item de promocion guarda:

- `product_id` siempre
- `product_variant_id` opcional

### 8.2 Lo que NO existe

No existe relacion directa backend entre:

- `price_list`
- `product_price`
- `promotion`

No hay:

- foreign key entre promotion y price list
- endpoint que una ambos modulos
- calculo backend de "promos aplicables a esta lista"

### 8.3 Implicacion oficial para frontend

Si quieres mostrar promociones relacionadas a una lista de precios, la unica
lectura honesta hoy es esta:

1. tomas los `product_prices` de una lista de forma indirecta desde productos
2. extraes los `product_id` y/o `product_variant_id`
3. cruzas eso con `promotions.items`

O sea:

- la relacion es indirecta
- la inferencia ocurre en frontend
- backend no expone esa vista consolidada

## 9. Assignments y Scopes Comerciales

### 9.1 Realidad actual

Existe un enum `PriceScopeLevel`, pero hoy no esta conectado a ningun flujo
publico ni a ninguna entidad persistida de pricing.

Por lo tanto, frontend debe asumir que:

- no hay scopes funcionales activos
- no hay assignments consumibles
- no hay UI backend-ready para ese tema todavia

### 9.2 Decision recomendada para frontend

En esta fase no construir:

- asignacion de lista por cliente
- asignacion por segmento
- asignacion por sucursal
- selector de scope comercial
- reglas por canal

Si se necesita mostrar algo, usar solo:

- `kind`
- `is_default`
- `is_active`

Pero no vender eso como "scope aplicado", porque no lo es.

## 10. Reglas Oficiales Para Frontend

### 10.1 Source of truth

Source of truth comercial actual:

- catalogo de listas: `GET /price-lists`
- filas de precios: `GET /products/:id/prices`
- promociones: `GET /promotions`

### 10.2 Lo que frontend debe hacer

- administrar `product_prices` dentro del contexto del producto
- tratar `product_variant` como dato complementario opcional de una fila
- usar `lifecycle` para botones de listas y filas
- tratar `promotions` como modulo separado
- si quiere cruzar promociones con listas, hacerlo como inferencia propia

### 10.3 Lo que frontend NO debe hacer

- no asumir modulo variant-level puro para pricing
- no asumir assignments o scopes
- no asumir effective price backend
- no asumir motor de combinacion precio + promocion
- no asumir que una lista trae sus promociones
- no asumir que el backend resuelve prioridad entre filas

## 11. Errores de Negocio Que Frontend Debe Mapear

Pricing:

- `PRICE_LIST_NOT_FOUND`
- `PRICE_LIST_NAME_DUPLICATE`
- `PRICE_LIST_INACTIVE`
- `CANNOT_DELETE_DEFAULT_PRICE_LIST`
- `PRODUCT_PRICE_NOT_FOUND`
- `PRICE_VALID_RANGE_INVALID`
- `PRODUCT_NOT_FOUND`
- `PRODUCT_INACTIVE`
- `VARIANT_PRODUCT_MISMATCH`
- `VARIANT_REQUIRED_FOR_MULTI_VARIANT_PRODUCT`
- `VARIANT_INACTIVE`

Promotions:

- `PROMOTION_NOT_FOUND`
- `PROMOTION_NAME_DUPLICATE`
- `PROMOTION_PRODUCT_OR_VARIANT_REQUIRED`
- `PROMOTION_DUPLICATE_ITEMS`
- `PROMOTION_ITEMS_OUTSIDE_BUSINESS`
- `PROMOTION_DISCOUNT_VALUE_REQUIRED`
- `PROMOTION_OVERRIDE_PRICE_REQUIRED`
- `PROMOTION_BUY_X_GET_Y_FIELDS_REQUIRED`
- `PROMOTION_DATE_RANGE_INVALID`
- `VARIANT_PRODUCT_MISMATCH`

## 12. Estrategia De Pantallas Recomendada

### 12.1 Pantalla de listas de precios

Mostrar:

- nombre
- kind
- currency
- default
- active/inactive
- acciones por `lifecycle`

No mostrar:

- assignments
- scope selector
- branch selector
- segment selector

### 12.2 Pantalla de precios del producto

Mostrar tabla de filas:

- lista de precio
- variante o "general"
- precio
- min_quantity
- vigencia
- activo/inactivo

Acciones:

- crear fila general
- crear fila para variante
- editar fila
- desactivar/reactivar fila
- eliminar fila

### 12.3 Pantalla de promociones

Mantener separada de price lists.

Si se quiere una vista enriquecida:

- mostrar productos/variantes afectados
- opcionalmente indicar si esos productos tienen precio en una lista elegida
- pero marcar eso como inferencia UI, no como relacion nativa backend

## 13. Refetch / Invalidacion Recomendada

- si cambia `price_list`:
  - invalidar `price-lists`
  - invalidar vistas de precios que dependan de ella
- si cambia `product_price`:
  - invalidar `product-prices(productId)`
  - si hay pantalla de price list enriquecida, recomputarla
- si cambia `promotion`:
  - invalidar `promotions`
  - invalidar vistas cruzadas cliente-side con price lists

## 14. Prompt Corto Para Codex Frontend

Usa este criterio como instruccion operativa:

1. Trata pricing actual como product-level public contract.
2. Maneja product prices dentro del producto, no como modulo variant-first.
3. Usa `product_variant` solo como refinamiento opcional de una fila.
4. No implementes assignments/scopes comerciales porque backend aun no los
   expone.
5. Mantén promotions separado de price lists.
6. Si cruzas promociones con listas, documenta en UI que es inferencia basada en
   productos/variantes compartidos, no una relacion backend directa.

