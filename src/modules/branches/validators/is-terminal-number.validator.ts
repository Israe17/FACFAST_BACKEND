import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { TERMINAL_NUMBER_PATTERN } from '../../common/utils/validation-patterns.util';

export function IsTerminalNumber(validation_options?: ValidationOptions) {
  return (object: object, property_name: string) => {
    registerDecorator({
      name: 'isTerminalNumber',
      target: object.constructor,
      propertyName: property_name,
      options: validation_options,
      validator: {
        validate(value: unknown) {
          return (
            typeof value === 'string' && TERMINAL_NUMBER_PATTERN.test(value)
          );
        },
        defaultMessage(args?: ValidationArguments) {
          return `${args?.property ?? 'value'} must be a 5 digit terminal number.`;
        },
      },
    });
  };
}
