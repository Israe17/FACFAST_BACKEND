import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactType } from '../enums/contact-type.enum';

export class CreateContactDto {
  @ApiPropertyOptional({ example: 'CT-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiProperty({
    enum: ContactType,
    example: ContactType.CUSTOMER,
  })
  @IsEnum(ContactType, { message: validation_messages.invalid_enum() })
  type!: ContactType;

  @ApiProperty({ example: 'Cliente de Mostrador' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name!: string;

  @ApiPropertyOptional({ example: 'FastFact Comercial' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  commercial_name?: string;

  @ApiProperty({
    enum: ContactIdentificationType,
    example: ContactIdentificationType.LEGAL,
    description:
      'Catalogo CR: 01 cedula fisica, 02 cedula juridica, 03 DIMEX, 04 NITE, 05 extranjero.',
  })
  @IsEnum(ContactIdentificationType, {
    message: validation_messages.invalid_enum(),
  })
  identification_type!: ContactIdentificationType;

  @ApiProperty({ example: '3101123456' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  identification_number!: string;

  @ApiPropertyOptional({ example: 'cliente@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email?: string;

  @ApiPropertyOptional({ example: '8888-9999' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  phone?: string;

  @ApiPropertyOptional({ example: 'San Jose, Escazu, San Rafael' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(5, { message: validation_messages.min_length() })
  address?: string;

  @ApiPropertyOptional({ example: 'San Jose' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  province?: string;

  @ApiPropertyOptional({ example: 'Escazu' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  canton?: string;

  @ApiPropertyOptional({ example: 'San Rafael' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  district?: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  tax_condition?: string;

  @ApiPropertyOptional({ example: '621100' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  economic_activity_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'purchase' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  exoneration_type?: string;

  @ApiPropertyOptional({ example: 'EXO-2026-0001' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  exoneration_document_number?: string;

  @ApiPropertyOptional({ example: 'Ministerio de Hacienda' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  exoneration_institution?: string;

  @ApiPropertyOptional({
    example: '2026-03-10',
    description: 'Fecha ISO 8601 sin hora.',
  })
  @IsOptional()
  @IsDateString({}, { message: validation_messages.invalid_date() })
  exoneration_issue_date?: string;

  @ApiPropertyOptional({ example: 50, minimum: 0, maximum: 100 })
  @IsOptional()
  @Min(0, { message: validation_messages.min_value() })
  @Max(100, { message: validation_messages.max_value() })
  exoneration_percentage?: number;
}
