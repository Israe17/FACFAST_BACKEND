# Error Handling, Logging and I18n Architecture

## Objective

This phase standardizes backend error handling so every module can:

1. distinguish expected vs unexpected errors
2. return a stable HTTP error shape
3. log failures with useful request and auth context
4. translate messages in `es` and `en`
5. use `messageKey` in DTO validation and domain rules

## Expected vs Unexpected Errors

### Expected errors

Expected errors are validation or business rule failures that the system knows
how to represent:

- DTO validation failures
- conflicts
- not found
- forbidden / unauthorized
- tenant or branch scope violations

These errors now carry:

- `code`
- `messageKey`
- translated `message`
- `details` when applicable

They are logged as `log` or `warn`, without stack traces in the client
response.

### Unexpected errors

Unexpected errors are anything not modeled explicitly:

- null references
- broken queries
- infrastructure failures
- unhandled exceptions

These return:

- `statusCode = 500`
- `code = INTERNAL_SERVER_ERROR`
- `messageKey = errors.internal_server_error`
- translated generic `message`

They are logged with full stack trace in the backend.

## Response Shape

Every error response now uses a uniform shape:

```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "code": "VALIDATION_ERROR",
  "messageKey": "validation.error",
  "message": "Hay errores de validacion.",
  "details": [
    {
      "field": "email",
      "code": "VALIDATION_INVALID_EMAIL",
      "messageKey": "validation.invalid_email",
      "message": "El correo electronico no es valido."
    }
  ],
  "path": "/users",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "requestId": "..."
}
```

## Validation Strategy with messageKey

DTO validation no longer depends on final hardcoded decorator messages.

The strategy is:

1. decorators use helpers from `common/validation/validation-message.util.ts`
2. helpers encode a `messageKey` payload instead of a final string
3. `ValidationPipe` uses a custom `exceptionFactory`
4. the factory converts class-validator errors into `RequestValidationException`
5. the global filter translates the final message per request language

This keeps validation reusable and language-agnostic.

## Concrete Validation Flow with messageKey

This is the exact implementation path used in the backend.

### 1. Helper used by class-validator decorators

The helper lives in:

- `src/modules/common/validation/validation-message.util.ts`

Core implementation:

```ts
export const VALIDATION_MESSAGE_PREFIX = '__validation_message__::';

export function validation_message(
  message_key: string,
  params?: ValidationMessageParams,
): ValidationOptions['message'] {
  return (args: ValidationArguments) =>
    `${VALIDATION_MESSAGE_PREFIX}${JSON.stringify({
      messageKey: message_key,
      params: normalize_params(args, params),
    })}`;
}

export function parse_validation_message(
  value: string,
): EncodedValidationMessage | null {
  if (!value.startsWith(VALIDATION_MESSAGE_PREFIX)) {
    return null;
  }

  return JSON.parse(value.replace(VALIDATION_MESSAGE_PREFIX, ''));
}
```

Reusable validation catalog:

```ts
export const validation_messages = {
  required: () => validation_message('validation.required'),
  invalid_email: () => validation_message('validation.invalid_email'),
  min_length: () =>
    validation_message('validation.min_length', (args) => ({
      field: args.property,
      min: Number(args.constraints[0]),
    })),
  invalid_enum: () => validation_message('validation.invalid_enum'),
  pattern_mismatch: () => validation_message('validation.pattern_mismatch'),
  min_value: () =>
    validation_message('validation.min_value', (args) => ({
      field: args.property,
      min: Number(args.constraints[0]),
    })),
  max_value: () =>
    validation_message('validation.max_value', (args) => ({
      field: args.property,
      max: Number(args.constraints[0]),
    })),
};
```

### 2. Real DTO example

Example adapted from `src/modules/users/dto/create-user.dto.ts`:

```ts
export class CreateUserDto {
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name!: string;

  @IsEmail({}, { message: validation_messages.invalid_email() })
  email!: string;

  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(10, { message: validation_messages.min_length() })
  password!: string;

  @IsOptional()
  @IsEnum(UserType, { message: validation_messages.invalid_enum() })
  user_type?: UserType;
}
```

About `required`:

- required fields are currently represented by leaving the property without
  `@IsOptional()`
- if the value arrives as `undefined` or `null`, the validation factory maps it
  to `validation.required`
- the helper `validation_messages.required()` also exists for explicit
  decorators such as `@IsDefined(...)` when needed

### 3. How the ValidationPipe converts errors into RequestValidationException

The global `ValidationPipe` uses:

- `src/modules/common/errors/validation-exception.factory.ts`

Configured in:

- `src/configure-app.ts`

```ts
app.useGlobalPipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    exceptionFactory: build_validation_exception,
  }),
);
```

Factory entry point:

```ts
export function build_validation_exception(
  validation_errors: ValidationError[],
): RequestValidationException {
  return new RequestValidationException(
    flatten_validation_errors(validation_errors),
  );
}
```

The factory resolves the final `messageKey` like this:

```ts
const parsed_message = parse_validation_message(raw_message);
const message_key =
  parsed_message?.messageKey ??
  resolve_required_message_key(validation_error) ??
  default_message_key_by_constraint.get(constraint_name) ??
  'validation.invalid_string';
```

Required detection:

```ts
function resolve_required_message_key(
  validation_error: ValidationError,
): string | null {
  if (validation_error.value === undefined || validation_error.value === null) {
    return 'validation.required';
  }

  return null;
}
```

Each detail is normalized to:

```ts
return {
  field,
  code: get_validation_code(message_key),
  messageKey: message_key,
  params: parsed_message?.params,
};
```

And then wrapped in:

```ts
export class RequestValidationException extends BadRequestException {
  constructor(details: ValidationErrorDetail[]) {
    super({
      statusCode: 400,
      error: 'ValidationError',
      code: 'VALIDATION_ERROR',
      messageKey: 'validation.error',
      details,
    });
  }
}
```

### 4. How field, code, messageKey and message reach the final HTTP response

The global filter:

- `src/modules/common/filters/http-exception.filter.ts`

For validation errors it preserves:

- `field`
- `code`
- `messageKey`
- `params`

Then it translates the final `message`:

```ts
return details.map((detail) => ({
  field: detail.field,
  code: detail.code,
  messageKey: detail.messageKey,
  message: this.error_i18n_service.translate(
    detail.messageKey,
    language,
    detail.params,
  ),
}));
```

Resulting HTTP shape:

```json
{
  "statusCode": 400,
  "error": "ValidationError",
  "code": "VALIDATION_ERROR",
  "messageKey": "validation.error",
  "message": "Hay errores de validacion.",
  "details": [
    {
      "field": "email",
      "code": "VALIDATION_INVALID_EMAIL",
      "messageKey": "validation.invalid_email",
      "message": "El correo electronico no es valido."
    },
    {
      "field": "password",
      "code": "VALIDATION_MIN_LENGTH",
      "messageKey": "validation.min_length",
      "message": "El campo password debe tener al menos 10 caracteres."
    }
  ],
  "path": "/users",
  "timestamp": "2026-03-13T12:00:00.000Z",
  "requestId": "..."
}
```

### 5. Dynamic placeholders and variables

Dynamic values are attached at the decorator level through `params`.

Example for `min_length`:

```ts
min_length: () =>
  validation_message('validation.min_length', (args) => ({
    field: args.property,
    min: Number(args.constraints[0]),
  })),
```

Example for `max_value`:

```ts
max_value: () =>
  validation_message('validation.max_value', (args) => ({
    field: args.property,
    max: Number(args.constraints[0]),
  })),
```

Translation interpolation happens in:

- `src/modules/common/i18n/error-i18n.service.ts`

```ts
return template.replace(/\{\{(\w+)\}\}/g, (_match, key: string) => {
  const value = params?.[key];
  return value === undefined || value === null ? '' : String(value);
});
```

Examples from the translation catalog:

```ts
'validation.min_length':
  'El campo {{field}} debe tener al menos {{min}} caracteres.',
'validation.max_value':
  'El campo {{field}} debe ser menor o igual a {{max}}.',
```

Current placeholder status in this phase:

- `min`, `max`, `length` are implemented with dynamic params
- `field` is implemented where it adds value
- `enum` and `pattern` currently use generic translated messages
- the infrastructure supports adding enum values or regex metadata later without
  changing the global architecture

## Domain Exception Strategy

Expected business errors use reusable domain exceptions in
`common/errors/exceptions/*`.

Examples:

- `DomainConflictException`
- `DomainBadRequestException`
- `DomainForbiddenException`
- `DomainNotFoundException`
- `DomainUnauthorizedException`

Services throw these with explicit metadata, for example:

```ts
throw new DomainConflictException({
  code: 'CONTACT_IDENTIFICATION_DUPLICATE',
  messageKey: 'contacts.identification_duplicate',
  details: { field: 'identification_number' },
});
```

The filter then translates and formats the response centrally.

## I18n Strategy

Error translations live in:

- `common/i18n/error-translations.ts`
- `common/i18n/error-i18n.service.ts`

Language resolution order:

1. active business language (`business.language`) using the active tenant context
2. `Accept-Language`
3. fallback `es`

This works for normal tenant users and for platform admins operating inside an
acting tenant context.

## Logging Strategy

Structured logging is centralized in:

- `common/logging/structured-logger.service.ts`

The global filter logs:

- method
- path
- statusCode
- code
- messageKey
- translated message
- `user_id`
- real `business_id`
- `acting_business_id`
- `acting_branch_id`
- `requestId`
- timestamp

Unexpected errors also include stack trace.

`requestId` is generated by `common/middleware/request-context.middleware.ts`
and returned in the `x-request-id` response header.

## Global Filter

`HttpExceptionFilter` is now the central point for:

- response normalization
- translation
- logging
- expected/unexpected error separation

It handles:

- `RequestValidationException`
- domain exceptions
- generic `HttpException`
- unknown unexpected errors

## Initial Module Adoption

This phase applies the new infrastructure directly in the most sensitive areas:

- `businesses/current`
- `users`
- `contacts`
- `branches`
- `auth`
- `platform context switching`
- `business onboarding`
- key RBAC flows

Other modules still benefit from the global filter and validation strategy even
if they still throw generic Nest exceptions in some paths.

## Deliberately Out of Scope

This phase does not include:

- frontend label translation
- CMS or dynamic translations
- external observability integrations
- full business audit trail
- global error metrics dashboards
- complete refactor of every existing service to domain exceptions

The goal here is a solid common foundation that all current and future modules
can reuse.
