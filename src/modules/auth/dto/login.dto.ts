import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { validation_messages } from '../../common/validation/validation-message.util';

export class LoginDto {
  @ApiProperty({
    example: 'owner@empresa.com',
    description: 'Correo unico del usuario.',
  })
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 10,
    description: 'Password del usuario.',
  })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(10, { message: validation_messages.min_length() })
  password!: string;
}
