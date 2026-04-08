import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  NUMERIC_STRING_PATTERN,
} from '../../common/utils/validation-patterns.util';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { validation_messages } from '../../common/validation/validation-message.util';
import { IsBranchNumber } from '../validators/is-branch-number.validator';

export class CreateBranchDto {
  @ApiPropertyOptional({ example: 'BR-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  code?: string;

  @ApiProperty({ example: 'FastFact Escazu' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  business_name!: string;

  @ApiPropertyOptional({ example: 'Escazu' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name?: string;

  @ApiProperty({ example: 'FastFact Sociedad Anonima' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  legal_name!: string;

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

  @ApiProperty({ example: '3101123456' })
  @IsString({ message: validation_messages.invalid_string() })
  @Matches(NUMERIC_STRING_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  cedula_juridica!: string;

  @ApiProperty({ example: '001' })
  @IsBranchNumber()
  branch_number!: string;

  @ApiProperty({ example: 'Centro Comercial Plaza, Local 5' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(5, { message: validation_messages.min_length() })
  address!: string;

  @ApiProperty({ example: 'San Jose' })
  @IsString({ message: validation_messages.invalid_string() })
  province!: string;

  @ApiProperty({ example: 'Escazu' })
  @IsString({ message: validation_messages.invalid_string() })
  canton!: string;

  @ApiProperty({ example: 'San Rafael' })
  @IsString({ message: validation_messages.invalid_string() })
  district!: string;

  @ApiPropertyOptional({ example: 'Escazu' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  city?: string;

  @ApiPropertyOptional({ example: '2222-3333' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  phone?: string;

  @ApiPropertyOptional({ example: 'sucursal@empresa.com' })
  @IsOptional()
  @IsEmail({}, { message: validation_messages.invalid_email() })
  email?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  activity_code?: string;

  @ApiPropertyOptional({ example: 'PROV-01' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  provider_code?: string;

  @ApiPropertyOptional({ example: 'C:/certs/sucursal.p12' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  cert_path?: string;

  @ApiPropertyOptional({
    example: 'clave-privada',
    description: 'Valor plano; el backend lo cifra antes de persistirlo.',
  })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  crypto_key?: string;

  @ApiPropertyOptional({ example: 'usuario_hacienda' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  hacienda_username?: string;

  @ApiPropertyOptional({
    example: 'password_hacienda',
    description: 'Valor plano; el backend lo cifra antes de persistirlo.',
  })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  hacienda_password?: string;

  @ApiPropertyOptional({
    example: 'mail-secret',
    description: 'Valor plano; el backend lo cifra antes de persistirlo.',
  })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  mail_key?: string;

  @ApiPropertyOptional({ example: 'p12' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  signature_type?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  is_active?: boolean;

  @ApiPropertyOptional({ example: 9.9280694 })
  @IsOptional()
  @IsNumber()
  latitude?: number | null;

  @ApiPropertyOptional({ example: -84.0907246 })
  @IsOptional()
  @IsNumber()
  longitude?: number | null;
}
