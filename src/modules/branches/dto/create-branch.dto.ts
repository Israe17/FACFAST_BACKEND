import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  NUMERIC_STRING_PATTERN,
} from '../../common/utils/validation-patterns.util';
import { IsBranchNumber } from '../validators/is-branch-number.validator';

export class CreateBranchDto {
  @ApiPropertyOptional({ example: 'BR-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'FastFact Escazu' })
  @IsString()
  @MinLength(2)
  business_name!: string;

  @ApiProperty({ example: 'FastFact Sociedad Anonima' })
  @IsString()
  @MinLength(2)
  legal_name!: string;

  @ApiProperty({ example: '3101123456' })
  @IsString()
  @Matches(NUMERIC_STRING_PATTERN)
  cedula_juridica!: string;

  @ApiProperty({ example: '001' })
  @IsBranchNumber()
  branch_number!: string;

  @ApiProperty({ example: 'Centro Comercial Plaza, Local 5' })
  @IsString()
  @MinLength(5)
  address!: string;

  @ApiProperty({ example: 'San Jose' })
  @IsString()
  province!: string;

  @ApiProperty({ example: 'Escazu' })
  @IsString()
  canton!: string;

  @ApiProperty({ example: 'San Rafael' })
  @IsString()
  district!: string;

  @ApiPropertyOptional({ example: '2222-3333' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'sucursal@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @IsString()
  activity_code?: string;

  @ApiPropertyOptional({ example: 'PROV-01' })
  @IsOptional()
  @IsString()
  provider_code?: string;

  @ApiPropertyOptional({ example: 'C:/certs/sucursal.p12' })
  @IsOptional()
  @IsString()
  cert_path?: string;

  @ApiPropertyOptional({
    example: 'clave-privada',
    description: 'Valor plano; el backend lo cifra antes de persistirlo.',
  })
  @IsOptional()
  @IsString()
  crypto_key?: string;

  @ApiPropertyOptional({ example: 'usuario_hacienda' })
  @IsOptional()
  @IsString()
  hacienda_username?: string;

  @ApiPropertyOptional({
    example: 'password_hacienda',
    description: 'Valor plano; el backend lo cifra antes de persistirlo.',
  })
  @IsOptional()
  @IsString()
  hacienda_password?: string;

  @ApiPropertyOptional({
    example: 'mail-secret',
    description: 'Valor plano; el backend lo cifra antes de persistirlo.',
  })
  @IsOptional()
  @IsString()
  mail_key?: string;

  @ApiPropertyOptional({ example: 'p12' })
  @IsOptional()
  @IsString()
  signature_type?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
