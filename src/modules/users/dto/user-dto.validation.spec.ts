import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateUserDto } from './create-user.dto';
import { UpdateUserDto } from './update-user.dto';

describe('User DTO validation', () => {
  it('rejects invalid functional codes', async () => {
    const dto = plainToInstance(CreateUserDto, {
      code: 'USER-1',
      name: 'Cashier',
      email: 'cashier@test.com',
      password: 'Password123',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'code')).toBe(true);
  });

  it('accepts manual code edits with the expected format', async () => {
    const dto = plainToInstance(UpdateUserDto, {
      code: 'US-0042',
      max_sale_discount: 15,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
