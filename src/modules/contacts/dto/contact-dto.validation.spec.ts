import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactType } from '../enums/contact-type.enum';
import { CreateContactDto } from './create-contact.dto';
import { UpdateContactDto } from './update-contact.dto';

describe('Contact DTO validation', () => {
  it('rejects invalid contact types', async () => {
    const dto = plainToInstance(CreateContactDto, {
      type: 'client',
      name: 'Contacto Demo',
      identification_type: ContactIdentificationType.LEGAL,
      identification_number: '3101123456',
    });

    const errors = await validate(dto);
    expect(errors.some((error) => error.property === 'type')).toBe(true);
  });

  it('rejects exoneration percentages outside the valid range', async () => {
    const dto = plainToInstance(CreateContactDto, {
      type: ContactType.CUSTOMER,
      name: 'Contacto Demo',
      identification_type: ContactIdentificationType.LEGAL,
      identification_number: '3101123456',
      exoneration_percentage: 150,
    });

    const errors = await validate(dto);
    expect(
      errors.some((error) => error.property === 'exoneration_percentage'),
    ).toBe(true);
  });

  it('accepts valid manual code edits and identification catalog values', async () => {
    const dto = plainToInstance(UpdateContactDto, {
      code: 'CT-0042',
      identification_type: ContactIdentificationType.DIMEX,
      type: ContactType.BOTH,
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
