# Backend Auth Architecture

## Objetivo

Base backend en NestJS para:

- autenticacion con JWT access + refresh rotativo
- cookies HttpOnly para frontend separado con `credentials: include`
- sesiones persistidas y revocables por dispositivo
- usuarios, roles y permisos
- aislamiento multiempresa por `business_id`
- acceso operativo por `branch_id`

## Estructura de modulos

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

- `common/services` contiene providers inyectables para Argon2, AES-GCM y generacion de `code`.
- `Business` vive en `common/entities` porque se necesita FK real sin abrir aun un modulo `businesses`.
- `roles.role_key` conserva el identificador funcional (`owner`, `admin`, etc.) mientras `roles.code` es el identificador visible autogenerado (`RL-0001`).

## Modelo de identificadores

- PK internas: `id` autoincremental.
- Relaciones/FK: siempre por `id`.
- `code` funcional separado, unico por tabla y editable con validacion.
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

- `users.email` unico global
- `roles.role_key` unico por `business_id`
- `branches.branch_number` unico por `business_id`
- `terminals.terminal_number` unico por `branch_id`
- `permissions.key` unico global
- `branch_number` de 3 digitos
- `terminal_number` de 5 digitos
- `cedula_juridica` numerica

## Bootstrap tecnico

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

1. recibe `email`, `password`
2. busca usuario por email y resuelve su `business_id`
3. bloquea si `status != active` o `allow_login = false`
4. valida password Argon2id
5. resuelve contexto autenticado con roles, permisos y sucursales
6. exige permiso `auth.login`
7. crea sesion en `refresh_tokens`
8. firma `access_token` y `refresh_token`
9. guarda el refresh token hasheado
10. responde cookies HttpOnly

## Flujo de refresh

`POST /auth/refresh`

1. lee `refresh_token` desde cookie
2. valida firma JWT con estrategia `jwt-refresh`
3. resuelve usuario activo
4. exige permiso `auth.refresh`
5. busca la sesion persistida por `session_id`
6. valida tenant, usuario, expiracion y hash del token
7. revoca sesion anterior
8. emite nueva sesion y nuevo par de tokens
9. actualiza cookies HttpOnly

## Flujo de logout

`POST /auth/logout`

1. intenta leer y verificar el refresh token de cookie
2. si la sesion existe, la revoca
3. limpia cookies de access y refresh
4. responde exito aunque el token ya no sea valido

## Cookies y sesion

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
- login resuelve usuario por `email`
- roles y usuarios no pueden cruzar empresa

### Branch

- operaciones de sucursal validan `branch_id` contra `branch_ids` del usuario
- `owner` puede operar sin restriccion de sucursal
- asignacion de sucursales valida:
  - pertenencia al mismo `business_id`
  - alcance operativo del usuario autenticado

## Policies implementadas

- aislamiento por `business_id`
- acceso operativo por `branch_id`
- gestion de usuarios dentro de la misma empresa
- proteccion de usuarios `owner` y `system`
- asignacion valida de sucursales del mismo negocio

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
- politicas tenant/branch
- validacion DTO de `code`
- resolucion de permisos efectivos

E2E:

- `login -> me -> refresh -> logout`
- denegacion por branch no asignada
- denegacion por cross-business
- denegacion por permisos faltantes
- denegacion de asignacion cruzada invalida
