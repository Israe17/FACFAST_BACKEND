import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from '../../users/dto/create-user.dto';
import { build_validation_exception } from './validation-exception.factory';

describe('build_validation_exception', () => {
  it('maps class-validator constraints into message keys and codes', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'A',
      email: 'invalid-email',
      password: 'short',
      role_ids: [1, 1],
    });

    const validation_errors = await validate(dto);
    const exception = build_validation_exception(validation_errors);
    const response = exception.getResponse() as {
      code: string;
      messageKey: string;
      details: { field: string; code: string; messageKey: string }[];
    };

    expect(response.code).toBe('VALIDATION_ERROR');
    expect(response.messageKey).toBe('validation.error');
    expect(response.details).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          field: 'email',
          code: 'VALIDATION_INVALID_EMAIL',
          messageKey: 'validation.invalid_email',
        }),
        expect.objectContaining({
          field: 'password',
          code: 'VALIDATION_MIN_LENGTH',
          messageKey: 'validation.min_length',
        }),
        expect.objectContaining({
          field: 'role_ids',
          code: 'VALIDATION_ARRAY_UNIQUE',
          messageKey: 'validation.array_unique',
        }),
      ]),
    );
  });
});
