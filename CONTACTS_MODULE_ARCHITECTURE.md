# Contacts Module Architecture

## Objetivo

El m&oacute;dulo `contacts` centraliza clientes y proveedores en una sola entidad tenant-aware para reutilizarla despu&eacute;s desde compras, ventas, gastos y facturaci&oacute;n electr&oacute;nica.

## Estructura

```text
src/modules/contacts/
  controllers/
    contacts.controller.ts
  dto/
    create-contact.dto.ts
    update-contact.dto.ts
  entities/
    contact.entity.ts
  enums/
    contact-identification-type.enum.ts
    contact-type.enum.ts
  repositories/
    contacts.repository.ts
  services/
    contacts.service.ts
```

No se agregaron policies ni infraestructura extra porque en esta fase `contacts` solo necesita aislamiento por `business_id`, y eso queda resuelto desde repository + service.

## Modelo de datos

Tabla: `contacts`

- PK interna: `id` autoincremental
- c&oacute;digo visible: `code`, &uacute;nico por tabla, autogenerado con prefijo `CT`
- tenant boundary: `business_id`
- soporte funcional para:
  - `customer`
  - `supplier`
  - `both`

Campos principales:

- `type`
- `name`
- `commercial_name`
- `identification_type`
- `identification_number`
- `email`
- `phone`
- `address`
- `province`
- `canton`
- `district`
- `tax_condition`
- `economic_activity_code`
- `is_active`
- `exoneration_type`
- `exoneration_document_number`
- `exoneration_institution`
- `exoneration_issue_date`
- `exoneration_percentage`

## Reglas aplicadas

- `id` autoincremental, sin UUID
- `code` separado de la PK y editable manualmente con validaci&oacute;n
- `code` autogenerado como `CT-0001`, `CT-0002`, etc.
- unicidad por negocio:
  - `business_id + identification_type + identification_number`
- aislamiento estricto por `business_id` en todas las consultas
- `exoneration_percentage` validado entre `0` y `100`
- `email` validado si viene informado
- `identification_type` validado contra cat&aacute;logo del sistema:
  - `01` c&eacute;dula f&iacute;sica
  - `02` c&eacute;dula jur&iacute;dica
  - `03` DIMEX
  - `04` NITE
  - `05` extranjero

## Flujo del m&oacute;dulo

### Crear contacto

1. valida DTO
2. valida formato de `code` manual si fue enviado
3. valida unicidad de `code`
4. valida unicidad de identificaci&oacute;n dentro del `business_id`
5. persiste el contacto
6. autogenera `code` si no ven&iacute;a informado

### Actualizar contacto

1. busca el contacto dentro del `business_id` autenticado
2. valida `code` manual si fue enviado
3. recalcula la combinaci&oacute;n efectiva de identificaci&oacute;n
4. valida conflictos dentro del mismo tenant
5. persiste cambios

### Lookup por identificaci&oacute;n

`GET /contacts/lookup/:identification`

- busca por `identification_number` dentro del `business_id` autenticado
- si no encuentra, responde `404`
- si encuentra m&aacute;s de un resultado con el mismo n&uacute;mero y distinto tipo, responde `400` por ambig&uuml;edad

## Permisos y seguridad

Permisos base agregados:

- `contacts.view`
- `contacts.create`
- `contacts.update`

Protecci&oacute;n aplicada:

- `GET /contacts` requiere `contacts.view`
- `GET /contacts/:id` requiere `contacts.view`
- `GET /contacts/lookup/:identification` requiere `contacts.view`
- `POST /contacts` requiere `contacts.create`
- `PATCH /contacts/:id` requiere `contacts.update`

## Endpoints implementados

- `GET /contacts`
- `POST /contacts`
- `GET /contacts/:id`
- `PATCH /contacts/:id`
- `GET /contacts/lookup/:identification`

## Integraci&oacute;n futura

El m&oacute;dulo queda listo para que compras, ventas, POS, gastos y hacienda consuman la misma fuente de contactos sin duplicar entidades de clientes y proveedores.

Se exportan `ContactsRepository` y `ContactsService` desde `ContactsModule` para facilitar reutilizaci&oacute;n en los siguientes m&oacute;dulos.
