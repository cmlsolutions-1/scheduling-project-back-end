import { registerDecorator, ValidationOptions } from 'class-validator';
import { isValidIanaTimeZone } from '../utils/time-zone.util';

export function IsIanaTimeZone(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return (target: object, propertyName: string | symbol) => {
    registerDecorator({
      name: 'isIanaTimeZone',
      target: target.constructor,
      propertyName: propertyName.toString(),
      options: {
        message: '$property debe ser una zona horaria IANA valida',
        ...validationOptions,
      },
      validator: {
        validate(value: unknown) {
          return isValidIanaTimeZone(value);
        },
      },
    });
  };
}
