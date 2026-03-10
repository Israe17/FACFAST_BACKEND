# Backend Auth Architecture

## Objetivo de esta fase

Base backend en NestJS para:

- autenticación con JWT access + refresh rotativo
- cookies HttpOnly para frontend separado con `credentials: include`
- sesiones persistidas y revocables por dispositivo
- usuarios, roles y permisos
- aislamiento multiempresa por `business_id`
- acceso operativo por `branch_id`

## Estructura de módulos

```text
src/
  config/
  modules/
    auth/
      controllers/
      dto/
      entities/
      interfaces/
      repositories/
      services/
      strategies/
      utils/
    users/
      controllers/
      dto/
      entities/
      policies/
      repositories/
      services/
    rbac/
      controllers/
      dto/
      entities/
      repositories/
      services/
    branches/
      controllers/
      dto/
      entities/
      policies/
      repositories/
      services/
      validators/
    common/
      decorators/
      entities/
      enums/
      filters/
      guards/
      interfaces/
      services/
      utils/
  scripts/
```

## Ajustes de estructura

- Se agregó `common/services` porque `argon2`, AES-GCM y generación de `code` son providers inyectables, no simples utilidades.
- `Business` quedó en `common/entities` porque en esta fase no existe módulo `businesses`, pero sí se necesita FK real desde tablas tenant-aware.
- `roles.role_key` se agregó para conservar el código funcional del rol (`owner`, `admin`, etc.) porque `roles.code` ahora es el identificador funcional autogenerado (`RL-0001`).

## Modelo de identificadores

- PK internas: `id` autoincremental.
- Relaciones/FK: siempre por `id`, nunca por `code`.
- `code` funcional separado, único por tabla, editable con validación.
- Prefijos implementados:
  - `BS` businesses
  - `US` users
  - `RL` roles
  - `PM` permissions
  - `BR` branches
  - `TR` terminals
  - `RT` refresh_tokens

Formato soportado:

- `XX-0001`
- `XX-0002`
- `XX-9999`

## Entidades implementadas

- `businesses`
- `users`
- `roles`
- `permissions`
- `user_roles`
- `role_permissions`
- `user_branch_access`
- `refresh_tokens`
- `branches`
- `terminals`

Restricciones clave:

- `users.email` único por `business_id`
- `roles.role_key` único por `business_id`
- `branches.branch_number` único por `business_id`
- `terminals.terminal_number` único por `branch_id`
- `permissions.key` único global
- `branch_number` de 3 dígitos
- `terminal_number` de 5 dígitos
- `cedula_juridica` numérica

## Bootstrap técnico

- `ConfigModule` global
- `TypeOrmModule` con PostgreSQL
- `synchronize=true` en esta fase
- `cookie-parser`
- CORS con `credentials: true`
- `ValidationPipe` global estricto
- filtro HTTP uniforme
- soporte de tests e2e con `pg-mem`

## Seguridad de datos

- passwords con Argon2id
- refresh tokens persistidos hasheados
- refresh tokens revocables y multi-dispositivo
- cifrado AES-GCM por ENV para:
  - `crypto_key_encrypted`
  - `hacienda_password_encrypted`
  - `mail_key_encrypted`

## Flujo de login

`POST /auth/login`

1. recibe `business_id`, `email`, `password`
2. busca usuario dentro del tenant
3. bloquea si `status != active` o `allow_login = false`
4. valida password Argon2id
5. resuelve contexto autenticado con roles, permisos y sucursales
6. exige permiso `auth.login`
7. crea sesión `refresh_tokens`
8. firma `access_token` y `refresh_token`
9. guarda el refresh token hasheado
10. responde cookies HttpOnly

## Flujo de refresh

`POST /auth/refresh`

1. lee `refresh_token` desde cookie
2. valida firma JWT con estrategia `jwt-refresh`
3. resuelve usuario activo
4. exige permiso `auth.refresh`
5. busca la sesión persistida por `session_id`
6. valida tenant, usuario, expiración y hash del token
7. revoca sesión anterior
8. emite nueva sesión y nuevo par de tokens
9. actualiza cookies HttpOnly

## Flujo de logout

`POST /auth/logout`

1. intenta leer y verificar el refresh token de cookie
2. si la sesión existe, la revoca
3. limpia cookies de access y refresh
4. responde éxito aunque el token ya no sea válido

## Cookies y sesión

Cookies configurables por ENV:

- `ACCESS_COOKIE_NAME`
- `REFRESH_COOKIE_NAME`
- `AUTH_COOKIE_SECURE`
- `AUTH_COOKIE_SAME_SITE`

Comportamiento actual:

- `HttpOnly`
- `path=/`
- `SameSite` configurable
- `Secure` configurable
- backend listo para frontend separado con `credentials: include`

## Guards y decorators

Guards implementados:

- `JwtAuthGuard`
- `RefreshTokenGuard`
- `PermissionsGuard`

Decorators implementados:

- `CurrentUser`
- `RequirePermissions`

## Contexto autenticado resuelto

`GET /auth/me` devuelve:

- `id`
- `business_id`
- `email`
- `name`
- `roles`
- `permissions`
- `branch_ids`
- `max_sale_discount`
- `user_type`

## RBAC

- permisos con formato `<module>.<action>`
- roles por tenant
- herencia de permisos desde roles
- seed idempotente de permisos base
- seed idempotente de roles sugeridos por negocio existente

Roles sugeridos sembrados:

- `owner`
- `admin`
- `branch_manager`
- `cashier`
- `purchasing`
- `accountant`
- `e_invoicing_operator`
- `auditor_readonly`

## Tenant y branch access

### Tenant

- toda consulta sensible se filtra por `business_id`
- login resuelve usuario por `email + business_id`
- roles y usuarios no pueden cruzar empresa

### Branch

- operaciones de sucursal validan `branch_id` contra `branch_ids` del usuario
- `owner` puede operar sin restricción de sucursal
- asignación de sucursales valida:
  - pertenencia al mismo `business_id`
  - alcance operativo del usuario autenticado

## Policies implementadas

- aislamiento por `business_id`
- acceso operativo por `branch_id`
- gestión de usuarios dentro de la misma empresa
- protección de usuarios `owner` y `system`
- asignación válida de sucursales del mismo negocio

## Endpoints implementados

### Auth

- `POST /auth/login`
- `POST /auth/refresh`
- `POST /auth/logout`
- `GET /auth/me`

### Users

- `GET /users`
- `POST /users`
- `GET /users/:id`
- `PATCH /users/:id`
- `PATCH /users/:id/status`
- `PATCH /users/:id/password`
- `PUT /users/:id/roles`
- `PUT /users/:id/branches`
- `GET /users/:id/effective-permissions`

### RBAC

- `GET /roles`
- `POST /roles`
- `PATCH /roles/:id`
- `DELETE /roles/:id`
- `PUT /roles/:id/permissions`
- `GET /permissions`

### Branches

- `GET /branches`
- `POST /branches`
- `GET /branches/:id`
- `PATCH /branches/:id`
- `POST /branches/:id/terminals`
- `PATCH /terminals/:id`

## Seed y bootstrap operativo

- permisos base se siembran en bootstrap
- roles sugeridos se siembran por negocio existente
- CLI implementado:

```bash
pnpm create-owner --name "Owner" --email owner@demo.test --password Password123 --business-name "Demo" --legal-name "Demo SA"
```

Opciones:

- `--business-id` para usar una empresa existente
- `--business-code` para setear manualmente `BS-0001`
- `--user-code` para setear manualmente `US-0001`

## Cobertura de pruebas

Unit tests:

- hashing Argon2
- login
- refresh rotativo
- logout
- políticas tenant/branch
- validación DTO de `code`
- resolución de permisos efectivos

E2E:

- `login -> me -> refresh -> logout`
- denegación por branch no asignada
- denegación por cross-business
- denegación por permisos faltantes
- denegación de asignación cruzada inválida
