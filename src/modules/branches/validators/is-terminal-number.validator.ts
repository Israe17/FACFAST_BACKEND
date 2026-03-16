import { registerDecorator, ValidationOptions } from 'class-validator';
import { TERMINAL_NUMBER_PATTERN } from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';

export function IsTerminalNumber(validation_options?: ValidationOptions) {
  return (object: object, property_name: string) => {
    registerDecorator({
      name: 'isTerminalNumber',
      target: object.constructor,
      propertyName: property_name,
      options: {
        ...validation_options,
        message:
          validation_options?.message ?? validation_messages.pattern_mismatch(),
      },
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' && TERMINAL_NUMBER_PATTERN.test(value)
          );
        },
      },
    });
  };
}
