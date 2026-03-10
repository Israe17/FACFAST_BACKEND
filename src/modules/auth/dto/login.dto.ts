import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsInt,
  IsPositive,
  IsString,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 1,
    description: 'ID de la empresa a la que pertenece el usuario.',
  })
  @IsInt()
  @IsPositive()
  business_id!: number;

  @ApiProperty({
    example: 'owner@empresa.com',
    description: 'Correo del usuario dentro del tenant.',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'Password123',
    minLength: 10,
    description: 'Password del usuario.',
  })
  @IsString()
  @MinLength(10)
  password!: string;
}
