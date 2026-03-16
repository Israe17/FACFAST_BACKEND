import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { IsBranchNumber } from '../../branches/validators/is-branch-number.validator';
import { IsTerminalNumber } from '../../branches/validators/is-terminal-number.validator';
import { IdentificationType } from '../../common/enums/identification-type.enum';
import { NUMERIC_STRING_PATTERN } from '../../common/utils/validation-patterns.util';
import { validation_messages } from '../../common/validation/validation-message.util';

const CURRENCY_CODE_PATTERN = /^[A-Z]{3}$/;

export class BusinessOnboardingBusinessDto {
  @ApiProperty({ example: 'Multillantas' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  name!: string;

  @ApiProperty({ example: 'Multillantas Sociedad Anonima' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  legal_name!: string;

  @ApiProperty({
    enum: IdentificationType,
    example: IdentificationType.LEGAL,
  })
  @IsEnum(IdentificationType, { message: validation_messages.invalid_enum() })
  identification_type!: IdentificationType;

  @ApiProperty({ example: '3101123456' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  identification_number!: string;

  @ApiProperty({ example: 'CRC' })
  @IsString({ message: validation_messages.invalid_string() })
  @Length(3, 3, { message: validation_messages.exact_length() })
  @Matches(CURRENCY_CODE_PATTERN, {
    message: validation_messages.pattern_mismatch(),
  })
  currency_code!: string;

  @ApiProperty({ example: 'America/Costa_Rica' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  timezone!: string;

  @ApiProperty({ example: 'es-CR' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  language!: string;

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

  @ApiProperty({ example: 'Costa Rica' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  country!: string;

  @ApiProperty({ example: 'Guanacaste' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  province!: string;

  @ApiProperty({ example: 'Liberia' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  canton!: string;

  @ApiProperty({ example: 'Liberia' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  district!: string;

  @ApiPropertyOptional({ example: 'Liberia' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  city?: string;

  @ApiProperty({ example: 'Frente al parque central' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(5, { message: validation_messages.min_length() })
  address!: string;

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

export class BusinessOnboardingOwnerDto {
  @ApiProperty({ example: 'Israel' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  owner_name!: string;

  @ApiProperty({ example: 'Rodriguez' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  owner_last_name!: string;

  @ApiProperty({ example: 'owner@multillantas.com' })
  @IsEmail({}, { message: validation_messages.invalid_email() })
  owner_email!: string;

  @ApiProperty({ example: 'ClaveSegura123!', minLength: 10 })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(10, { message: validation_messages.min_length() })
  owner_password!: string;
}

export class BusinessOnboardingInitialBranchDto {
  @ApiProperty({ example: 'Liberia' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  branch_name!: string;

  @ApiProperty({ example: '001' })
  @IsBranchNumber()
  branch_number!: string;

  @ApiProperty({
    enum: IdentificationType,
    example: IdentificationType.LEGAL,
  })
  @IsEnum(IdentificationType, { message: validation_messages.invalid_enum() })
  branch_identification_type!: IdentificationType;

  @ApiProperty({ example: '3101123456' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  branch_identification_number!: string;

  @ApiPropertyOptional({ example: 'liberia@multillantas.com' })
  @IsOptional()
  @IsEmail({}, { message: validation_messages.invalid_email() })
  branch_email?: string;

  @ApiPropertyOptional({ example: '2666-7777' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  branch_phone?: string;

  @ApiProperty({ example: '200m oeste del parque central' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(5, { message: validation_messages.min_length() })
  branch_address!: string;

  @ApiProperty({ example: 'Guanacaste' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  branch_province!: string;

  @ApiProperty({ example: 'Liberia' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  branch_canton!: string;

  @ApiProperty({ example: 'Liberia' })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  branch_district!: string;

  @ApiPropertyOptional({ example: 'Liberia' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  branch_city?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  activity_code?: string;

  @ApiPropertyOptional({ example: 'PROV-01' })
  @IsOptional()
  @IsString({ message: validation_messages.invalid_string() })
  provider_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  is_active?: boolean;
}

export class BusinessOnboardingInitialTerminalDto {
  @ApiProperty({ example: true })
  @IsBoolean({ message: validation_messages.invalid_boolean() })
  create_initial_terminal!: boolean;

  @ApiPropertyOptional({ example: 'Caja 1' })
  @ValidateIf((value: BusinessOnboardingInitialTerminalDto) => {
    return value.create_initial_terminal;
  })
  @IsString({ message: validation_messages.invalid_string() })
  @MinLength(2, { message: validation_messages.min_length() })
  terminal_name?: string;

  @ApiPropertyOptional({ example: '00001' })
  @ValidateIf((value: BusinessOnboardingInitialTerminalDto) => {
    return value.create_initial_terminal;
  })
  @IsTerminalNumber()
  terminal_number?: string;
}

export class CreateBusinessOnboardingDto {
  @ApiProperty({ type: BusinessOnboardingBusinessDto })
  @ValidateNested({ message: validation_messages.invalid_nested_object() })
  @Type(() => BusinessOnboardingBusinessDto)
  business!: BusinessOnboardingBusinessDto;

  @ApiProperty({ type: BusinessOnboardingOwnerDto })
  @ValidateNested({ message: validation_messages.invalid_nested_object() })
  @Type(() => BusinessOnboardingOwnerDto)
  owner!: BusinessOnboardingOwnerDto;

  @ApiProperty({ type: BusinessOnboardingInitialBranchDto })
  @ValidateNested({ message: validation_messages.invalid_nested_object() })
  @Type(() => BusinessOnboardingInitialBranchDto)
  initial_branch!: BusinessOnboardingInitialBranchDto;

  @ApiPropertyOptional({ type: BusinessOnboardingInitialTerminalDto })
  @IsOptional()
  @ValidateNested({ message: validation_messages.invalid_nested_object() })
  @Type(() => BusinessOnboardingInitialTerminalDto)
  initial_terminal?: BusinessOnboardingInitialTerminalDto;
}
