import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNumber,
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

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'CT-0042' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiPropertyOptional({
    enum: ContactType,
    example: ContactType.SUPPLIER,
  })
  @IsOptional()
  @IsEnum(ContactType, { message: validation_messages.invalid_enum() })
  type?: ContactType;

  @ApiPropertyOptional({ example: 'Proveedor Regional' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name?: string;

  @ApiPropertyOptional({ example: 'Distribuciones del Valle' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  commercial_name?: string;

  @ApiPropertyOptional({
    enum: ContactIdentificationType,
    example: ContactIdentificationType.DIMEX,
  })
  @IsOptional()
  @IsEnum(ContactIdentificationType, {
    message: validation_messages.invalid_enum(),
  })
  identification_type?: ContactIdentificationType;

  @ApiPropertyOptional({ example: '155512345678' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  identification_number?: string;

  @ApiPropertyOptional({ example: 'contacto@proveedor.com', nullable: true })
  @IsOptional()
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email?: string;

  @ApiPropertyOptional({ example: '2222-3333', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  phone?: string;

  @ApiPropertyOptional({
    example: 'Heredia, Ulloa, Zona Franca',
    nullable: true,
  })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(5, { message: validation_messages.min_length() })
  address?: string;

  @ApiPropertyOptional({ example: 'Heredia', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  province?: string;

  @ApiPropertyOptional({ example: 'Heredia', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  canton?: string;

  @ApiPropertyOptional({ example: 'Ulloa', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  district?: string;

  @ApiPropertyOptional({ example: 'simplificado', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  tax_condition?: string;

  @ApiPropertyOptional({ example: '466100', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  economic_activity_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'government', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  exoneration_type?: string;

  @ApiPropertyOptional({ example: 'DOC-EXO-01', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  exoneration_document_number?: string;

  @ApiPropertyOptional({ example: 'CCSS', nullable: true })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  exoneration_institution?: string;

  @ApiPropertyOptional({ example: '2026-03-10', nullable: true })
  @IsOptional()
  @IsDateString({}, { message: validation_messages.invalid_date() })
  exoneration_issue_date?: string;

  @ApiPropertyOptional({
    example: 13,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @Min(0, { message: validation_messages.min_value() })
  @Max(100, { message: validation_messages.max_value() })
  exoneration_percentage?: number;

  @ApiPropertyOptional({ example: 9.9281, nullable: true })
  @IsOptional()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  delivery_latitude?: number;

  @ApiPropertyOptional({ example: -84.0907, nullable: true })
  @IsOptional()
  @IsNumber({}, { message: validation_messages.invalid_number() })
  delivery_longitude?: number;
}
