import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { BRANCH_NUMBER_PATTERN } from '../../common/utils/validation-patterns.util';

export function IsBranchNumber(validation_options?: ValidationOptions) {
  return (object: object, property_name: string) => {
    registerDecorator({
      name: 'isBranchNumber',
      target: object.constructor,
      propertyName: property_name,
      options: validation_options,
      validator: {
        validate(value: unknown) {
          return typeof value === 'string' && BRANCH_NUMBER_PATTERN.test(value);
        },
        defaultMessage(args?: ValidationArguments) {
          return `${args?.property ?? 'value'} must be a 3 digit branch number.`;
        },
      },
    });
  };
}
