import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
} from 'class-validator';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  NUMERIC_STRING_PATTERN,
} from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export class UpdateCurrentBusinessDto {
  @ApiPropertyOptional({ example: 'BS-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiPropertyOptional({ example: 'Multillantas' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name?: string;

  @ApiPropertyOptional({ example: 'Multillantas Sociedad Anonima' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  legal_name?: string;

  @ApiPropertyOptional({
    enum: IdentificationType,
    example: IdentificationType.LEGAL,
  })
  @IsOptional()
  @IsEnum(IdentificationType, { message: validation_messages.invalid_enum() })
  identification_type?: IdentificationType;

  @ApiPropertyOptional({ example: '3101123456' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  identification_number?: string;

  @ApiPropertyOptional({ example: 'CRC' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @Length(3, 3, { message: validation_messages.exact_length() })
  @Matches(CURRENCY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  currency_code?: string;

  @ApiPropertyOptional({ example: 'America/Costa_Rica' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  timezone?: string;

  @ApiPropertyOptional({ example: 'es-CR' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  language?: string;

  @ApiPropertyOptional({ example: 'empresa@multillantas.com' })
  @IsOptional()
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email?: string;

  @ApiPropertyOptional({ example: '2222-3333' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  phone?: string;

  @ApiPropertyOptional({ example: 'https://multillantas.com' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  website?: string;

  @ApiPropertyOptional({ example: 'https://cdn.multillantas.com/logo.png' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  logo_url?: string;

  @ApiPropertyOptional({ example: 'Costa Rica' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  country?: string;

  @ApiPropertyOptional({ example: 'Guanacaste' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  province?: string;

  @ApiPropertyOptional({ example: 'Liberia' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  canton?: string;

  @ApiPropertyOptional({ example: 'Liberia' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  district?: string;

  @ApiPropertyOptional({ example: 'Liberia' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  city?: string;

  @ApiPropertyOptional({ example: 'Frente al parque central' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(5, { message: validation_messages.min_length() })
  address?: string;

  @ApiPropertyOptional({ example: '50101' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @Matches(NUMERIC_STRING_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  postal_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  is_active?: boolean;
}
