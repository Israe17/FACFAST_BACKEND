import { ValidationArguments, ValidationOptions } from 'class-validator';

export const VALIDATION_MESSAGE_PREFIX = '__validation_message__::';

type ValidationMessageParams =
  | Record<string, string | number | boolean | null | undefined>
  | ((
      args: ValidationArguments,
    ) => Record<string, string | number | boolean | null | undefined>);

interface EncodedValidationMessage {
  messageKey: string;
  params?: Record<string, string | number | boolean | null | undefined>;
}

function normalize_params(
  args: ValidationArguments,
  params?: ValidationMessageParams,
): Record<string, string | number | boolean | null | undefined> | undefined {
  if (!params) {
    return undefined;
  }

  return typeof params === 'function' ? params(args) : params;
}

export function validation_message(
  message_key: string,
  params?: ValidationMessageParams,
): ValidationOptions['message'] {
  return (args: ValidationArguments) =>
    `${VALIDATION_MESSAGE_PREFIX}${JSON.stringify({
      messageKey: message_key,
      params: normalize_params(args, params),
    } satisfies EncodedValidationMessage)}`;
}

export function parse_validation_message(
  value: string,
): EncodedValidationMessage | null {
  if (!value.startsWith(VALIDATION_MESSAGE_PREFIX)) {
    return null;
  }

  try {
    return JSON.parse(
      value.replace(VALIDATION_MESSAGE_PREFIX, ''),
    ) as EncodedValidationMessage;
  } catch {
    return null;
  }
}

export const validation_messages = {
  required: () => validation_message('validation.required'),
  invalid_string: () => validation_message('validation.invalid_string'),
  invalid_email: () => validation_message('validation.invalid_email'),
  min_length: () =>
    validation_message('validation.min_length', (args) => ({
      field: args.property,
      min: Number(args.constraints[0]),
    })),
  max_length: () =>
    validation_message('validation.max_length', (args) => ({
      field: args.property,
      max: Number(args.constraints[0]),
    })),
  exact_length: () =>
    validation_message('validation.exact_length', (args) => ({
      field: args.property,
      length: Number(args.constraints[0]),
    })),
  invalid_enum: () => validation_message('validation.invalid_enum'),
  invalid_number: () => validation_message('validation.invalid_number'),
  invalid_boolean: () => validation_message('validation.invalid_boolean'),
  invalid_date: () => validation_message('validation.invalid_date'),
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
  positive_number: () => validation_message('validation.positive_number'),
  array_required: () => validation_message('validation.array_required'),
  array_unique: () => validation_message('validation.array_unique'),
  invalid_uuid: () => validation_message('validation.invalid_uuid'),
  pattern_mismatch: () => validation_message('validation.pattern_mismatch'),
  invalid_nested_object: () =>
    validation_message('validation.invalid_nested_object'),
};
