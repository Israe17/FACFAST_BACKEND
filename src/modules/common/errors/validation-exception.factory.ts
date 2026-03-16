import { ValidationError } from 'class-validator';
import { RequestValidationException } from './exceptions/request-validation.exception';
import { ValidationErrorDetail } from './interfaces/error-response.interface';
import { get_validation_code } from './utils/error-code.util';
import { parse_validation_message } from '../validation/validation-message.util';

const default_message_key_by_constraint = new Map<string, string>([
  ['isDefined', 'validation.required'],
  ['isNotEmpty', 'validation.required'],
  ['isEmail', 'validation.invalid_email'],
  ['minLength', 'validation.min_length'],
  ['maxLength', 'validation.max_length'],
  ['isLength', 'validation.exact_length'],
  ['isEnum', 'validation.invalid_enum'],
  ['isInt', 'validation.invalid_number'],
  ['isNumber', 'validation.invalid_number'],
  ['isBoolean', 'validation.invalid_boolean'],
  ['isDateString', 'validation.invalid_date'],
  ['min', 'validation.min_value'],
  ['max', 'validation.max_value'],
  ['isPositive', 'validation.positive_number'],
  ['isArray', 'validation.array_required'],
  ['arrayUnique', 'validation.array_unique'],
  ['isUuid', 'validation.invalid_uuid'],
  ['matches', 'validation.pattern_mismatch'],
  ['isString', 'validation.invalid_string'],
  ['nestedValidation', 'validation.invalid_nested_object'],
  ['isBranchNumber', 'validation.pattern_mismatch'],
  ['isTerminalNumber', 'validation.pattern_mismatch'],
]);

export function build_validation_exception(
  validation_errors: ValidationError[],
): RequestValidationException {
  return new RequestValidationException(
    flatten_validation_errors(validation_errors),
  );
}

function flatten_validation_errors(
  validation_errors: ValidationError[],
  parent_path?: string,
): ValidationErrorDetail[] {
  return validation_errors.flatMap((validation_error) => {
    const field = parent_path
      ? `${parent_path}.${validation_error.property}`
      : validation_error.property;

    const current_details = Object.entries(
      validation_error.constraints ?? {},
    ).map(([constraint_name, raw_message]) =>
      build_validation_detail(
        validation_error,
        field,
        constraint_name,
        raw_message,
      ),
    );

    const child_details = flatten_validation_errors(
      validation_error.children ?? [],
      field,
    );

    return [...current_details, ...child_details];
  });
}

function build_validation_detail(
  validation_error: ValidationError,
  field: string,
  constraint_name: string,
  raw_message: string,
): ValidationErrorDetail {
  const parsed_message = parse_validation_message(raw_message);
  const message_key =
    parsed_message?.messageKey ??
    resolve_required_message_key(validation_error) ??
    default_message_key_by_constraint.get(constraint_name) ??
    'validation.invalid_string';

  return {
    field,
    code: get_validation_code(message_key),
    messageKey: message_key,
    params: parsed_message?.params,
  };
}

function resolve_required_message_key(
  validation_error: ValidationError,
): string | null {
  if (validation_error.value === undefined || validation_error.value === null) {
    return 'validation.required';
  }

  return null;
}
