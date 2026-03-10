import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateBranchDto {
  @ApiPropertyOptional({ example: 'BR-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiPropertyOptional({ example: 'FastFact Heredia' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  business_name?: string;

  @ApiPropertyOptional({ example: 'FastFact Sociedad Anonima' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  legal_name?: string;

  @ApiPropertyOptional({ example: '3101123456' })
  @IsOptional()
  @IsString()
  @Matches(NUMERIC_STRING_PATTERN)
  cedula_juridica?: string;

  @ApiPropertyOptional({ example: '002' })
  @IsOptional()
  @IsBranchNumber()
  branch_number?: string;

  @ApiPropertyOptional({ example: 'Avenida Central, Local 8' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;

  @ApiPropertyOptional({ example: 'Heredia' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'Central' })
  @IsOptional()
  @IsString()
  canton?: string;

  @ApiPropertyOptional({ example: 'Mercedes' })
  @IsOptional()
  @IsString()
  district?: string;

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

  @ApiPropertyOptional({ example: 'clave-privada' })
  @IsOptional()
  @IsString()
  crypto_key?: string;

  @ApiPropertyOptional({ example: 'usuario_hacienda' })
  @IsOptional()
  @IsString()
  hacienda_username?: string;

  @ApiPropertyOptional({ example: 'password_hacienda' })
  @IsOptional()
  @IsString()
  hacienda_password?: string;

  @ApiPropertyOptional({ example: 'mail-secret' })
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
