# Inventory Catalog Architecture

## Objetivo

Esta fase agrega una base backend extensible para cat&aacute;logo de productos/servicios e inventario multisucursal sobre la arquitectura NestJS existente.

El dise&ntilde;o soporta:

- productos f&iacute;sicos
- servicios
- inventario simple
- lotes y vencimientos opcionales
- m&uacute;ltiples bodegas por sucursal
- ubicaciones opcionales dentro de bodega
- listas de precios
- garant&iacute;as
- promociones
- perfiles fiscales separados del producto

## Decisi&oacute;n de m&oacute;dulo

Se implementa un solo m&oacute;dulo `inventory` con subestructuras internas en lugar de abrir `catalog` + `inventory`.

Razones:

- mantiene la arquitectura por dominio ya usada en el proyecto
- reduce acoplamiento prematuro entre productos, precios, bodegas, stock y movimientos
- deja una superficie clara para que compras, ventas, POS y gastos reutilicen el mismo m&oacute;dulo m&aacute;s adelante

## Estructura

```text
src/modules/inventory/
  controllers/
  dto/
  entities/
  enums/
  repositories/
  services/
```

## Categor&iacute;as

Tabla: `product_categories`

- jerarqu&iacute;a por `parent_id`
- `level` y `path` persistidos para lecturas simples y &aacute;rbol r&aacute;pido
- unicidad funcional por `business_id + parent_id + name`
- endpoint `GET /product-categories/tree` resuelve el &aacute;rbol completo del tenant

## Marcas

Tabla: `brands`

- cat&aacute;logo por `business_id`
- relaci&oacute;n opcional desde `products`

## Unidades

Tabla: `measurement_units`

Decisi&oacute;n:

- se manejan por tenant, no como cat&aacute;logo global

Raz&oacute;n:

- simplifica aislamiento multiempresa
- evita mezclar cat&aacute;logos globales con personalizaciones por negocio en esta fase

## Tax Profiles

Tabla: `tax_profiles`

Se desacopla la l&oacute;gica fiscal del producto:

- `cabys_code`
- `item_kind`: `goods | service`
- `tax_type`: `iva | exento | no_sujeto | specific_tax`
- tasas y banderas fiscales

El producto referencia `tax_profile_id`, pero la l&oacute;gica de snapshot para l&iacute;neas de venta queda para fases futuras.

## Products

Tabla: `products`

Soporta:

- `type = product`
- `type = service`

Flags funcionales:

- `track_inventory`
- `track_lots`
- `track_expiration`
- `allow_negative_stock`
- `has_warranty`

Reglas aplicadas:

- si `type = service`, se fuerzan `track_inventory = false`, `track_lots = false`, `track_expiration = false`
- si `track_lots = true`, el producto debe ser inventariable
- si `track_expiration = true`, el producto debe ser inventariable y con lotes
- relaciones como categor&iacute;a, marca, unidades, tax profile y warranty profile deben pertenecer al mismo `business_id`

## Price Lists y Product Prices

Tablas:

- `price_lists`
- `product_prices`

Soporta:

- precio retail
- mayoreo
- cr&eacute;dito
- precio especial

`product_prices` permite vigencias opcionales y `min_quantity`, dejando lista la base para reglas futuras de pricing sin amarrarlas a ventas todav&iacute;a.

## Warranty Profiles

Tabla: `warranty_profiles`

El producto puede vincular un perfil de garant&iacute;a sin incrustar esa duraci&oacute;n directamente en el item.

## Promotions

Tablas:

- `promotions`
- `promotion_items`

Tipos soportados:

- `percentage`
- `fixed_amount`
- `buy_x_get_y`
- `price_override`

En esta fase:

- las promociones se administran como cat&aacute;logo
- no se ejecuta motor autom&aacute;tico de aplicaci&oacute;n
- `promotion_items` se administra anidado dentro de `POST/PATCH /promotions`

## Warehouses

Tabla: `warehouses`

- pertenecen a `branch_id`
- cada warehouse pertenece a un solo `business_id`
- una sucursal puede tener varias bodegas
- `uses_locations` habilita ubicaciones internas opcionales

## Warehouse Locations

Tabla: `warehouse_locations`

- pertenecen a `warehouse_id`
- heredan coherencia por `business_id` y `branch_id`
- se validan contra la bodega correspondiente

## Warehouse Stock

Tabla: `warehouse_stock`

Representa el saldo agregado por:

- `warehouse_id`
- `product_id`

Incluye:

- `quantity`
- `reserved_quantity`
- `min_stock`
- `max_stock`

Solo aplica a productos con `track_inventory = true`.

Los servicios no generan stock.

## Inventory Lots

Tabla: `inventory_lots`

Se usa solo si el producto tiene `track_lots = true`.

Soporta:

- `lot_number`
- `expiration_date`
- `manufacturing_date`
- `received_at`
- `location_id` opcional
- `supplier_contact_id` opcional

Reglas:

- unicidad por `warehouse_id + product_id + lot_number`
- si el producto rastrea vencimiento, el lote puede registrar `expiration_date`
- para productos sin lotes no se permiten registros en esta tabla

## Inventory Movements

Tabla: `inventory_movements`

Historial base de movimientos de inventario:

- `purchase_in`
- `sale_out`
- `adjustment_in`
- `adjustment_out`
- `transfer_in`
- `transfer_out`
- `return_in`
- `return_out`

En esta fase solo se expone:

- `GET /inventory-movements`
- `POST /inventory-movements/adjust`

El endpoint de ajuste actualiza:

- `warehouse_stock`
- `inventory_lots.current_quantity` cuando aplique
- historial en `inventory_movements`

## Tenant, Branch y Warehouse Rules

Reglas aplicadas:

- `business_id` nunca entra desde el frontend en operaciones sensibles
- `business_id` se resuelve desde el usuario autenticado
- todas las consultas filtran por `business_id`
- cuando existe `branch_id`, debe pertenecer al mismo negocio del usuario
- cuando existe `warehouse_id`, debe pertenecer al mismo negocio y a una sucursal accesible
- cuando existe `location_id`, debe pertenecer a la bodega indicada
- un producto no puede usarse fuera de su tenant
- contactos proveedores usados en lotes deben pertenecer al mismo tenant

## Permisos agregados

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
- `products.view`
- `products.create`
- `products.update`
- `price_lists.view`
- `price_lists.create`
- `price_lists.update`
- `product_prices.view`
- `product_prices.create`
- `product_prices.update`
- `warranty_profiles.view`
- `warranty_profiles.create`
- `warranty_profiles.update`
- `promotions.view`
- `promotions.create`
- `promotions.update`
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

## Lo que queda fuera de esta fase

- compras
- ventas
- POS
- gastos
- Hacienda
- transferencias completas entre bodegas
- FEFO autom&aacute;tico
- alertas de vencimiento
- seriales
- combos avanzados
- producci&oacute;n o recetas
- frontend
