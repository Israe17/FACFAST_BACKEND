const generic_error_code_by_status = new Map<number, string>([
  [400, 'BAD_REQUEST'],
  [401, 'UNAUTHORIZED'],
  [403, 'FORBIDDEN'],
  [404, 'NOT_FOUND'],
  [409, 'CONFLICT'],
  [500, 'INTERNAL_SERVER_ERROR'],
]);

const generic_message_key_by_status = new Map<number, string>([
  [400, 'errors.bad_request'],
  [401, 'errors.unauthorized'],
  [403, 'errors.forbidden'],
  [404, 'errors.not_found'],
  [409, 'errors.conflict'],
  [500, 'errors.internal_server_error'],
]);

const explicit_validation_codes = new Map<string, string>([
  ['validation.required', 'VALIDATION_REQUIRED'],
  ['validation.invalid_email', 'VALIDATION_INVALID_EMAIL'],
  ['validation.min_length', 'VALIDATION_MIN_LENGTH'],
  ['validation.max_length', 'VALIDATION_MAX_LENGTH'],
  ['validation.exact_length', 'VALIDATION_EXACT_LENGTH'],
  ['validation.invalid_enum', 'VALIDATION_INVALID_ENUM'],
  ['validation.invalid_number', 'VALIDATION_INVALID_NUMBER'],
  ['validation.invalid_boolean', 'VALIDATION_INVALID_BOOLEAN'],
  ['validation.invalid_date', 'VALIDATION_INVALID_DATE'],
  ['validation.min_value', 'VALIDATION_MIN_VALUE'],
  ['validation.max_value', 'VALIDATION_MAX_VALUE'],
  ['validation.positive_number', 'VALIDATION_POSITIVE_NUMBER'],
  ['validation.array_required', 'VALIDATION_ARRAY_REQUIRED'],
  ['validation.invalid_uuid', 'VALIDATION_INVALID_UUID'],
  ['validation.pattern_mismatch', 'VALIDATION_PATTERN_MISMATCH'],
  ['validation.array_unique', 'VALIDATION_ARRAY_UNIQUE'],
  ['validation.invalid_string', 'VALIDATION_INVALID_STRING'],
  ['validation.invalid_nested_object', 'VALIDATION_INVALID_NESTED_OBJECT'],
]);

export function get_generic_error_code(status_code: number): string {
  return generic_error_code_by_status.get(status_code) ?? 'HTTP_ERROR';
}

export function get_generic_message_key(status_code: number): string {
  return (
    generic_message_key_by_status.get(status_code) ??
    'errors.internal_server_error'
  );
}

export function get_validation_code(message_key: string): string {
  return (
    explicit_validation_codes.get(message_key) ??
    `VALIDATION_${message_key
      .replace(/^validation\./, '')
      .replace(/[^a-zA-Z0-9]+/g, '_')
      .toUpperCase()}`
  );
}
