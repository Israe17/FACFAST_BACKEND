import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { RegisterProductSerialsDto } from './register-product-serials.dto';
import { UpdateProductSerialStatusDto } from './update-product-serial-status.dto';
import { SerialStatus } from '../enums/serial-status.enum';

describe('Product serial DTO validation', () => {
  it('rejects empty serial batches', async () => {
    const dto = plainToInstance(RegisterProductSerialsDto, {
      serial_numbers: [],
      warehouse_id: 5,
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'serial_numbers')).toBe(
      true,
    );
  });

  it('accepts a valid serial registration payload', async () => {
    const dto = plainToInstance(RegisterProductSerialsDto, {
      serial_numbers: ['SN-1001', 'SN-1002'],
      warehouse_id: 5,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid serial status updates', async () => {
    const dto = plainToInstance(UpdateProductSerialStatusDto, {
      status: 'archived',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'status')).toBe(true);
  });

  it('accepts valid serial status updates', async () => {
    const dto = plainToInstance(UpdateProductSerialStatusDto, {
      status: SerialStatus.RESERVED,
      notes: 'Apartado para despacho',
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
