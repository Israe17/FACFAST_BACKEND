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
import { ContactIdentificationType } from '../enums/contact-identification-type.enum';
import { ContactType } from '../enums/contact-type.enum';

export class CreateContactDto {
  @ApiPropertyOptional({ example: 'CT-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({
    enum: ContactType,
    example: ContactType.CUSTOMER,
  })
  @IsEnum(ContactType)
  type!: ContactType;

  @ApiProperty({ example: 'Cliente de Mostrador' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'FastFact Comercial' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  commercial_name?: string;

  @ApiProperty({
    enum: ContactIdentificationType,
    example: ContactIdentificationType.LEGAL,
    description:
      'Catalogo CR: 01 cedula fisica, 02 cedula juridica, 03 DIMEX, 04 NITE, 05 extranjero.',
  })
  @IsEnum(ContactIdentificationType)
  identification_type!: ContactIdentificationType;

  @ApiProperty({ example: '3101123456' })
  @IsString()
  @MinLength(2)
  identification_number!: string;

  @ApiPropertyOptional({ example: 'cliente@empresa.com' })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '8888-9999' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: 'San Jose, Escazu, San Rafael' })
  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;

  @ApiPropertyOptional({ example: 'San Jose' })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'Escazu' })
  @IsOptional()
  @IsString()
  canton?: string;

  @ApiPropertyOptional({ example: 'San Rafael' })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'general' })
  @IsOptional()
  @IsString()
  tax_condition?: string;

  @ApiPropertyOptional({ example: '621100' })
  @IsOptional()
  @IsString()
  economic_activity_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'purchase' })
  @IsOptional()
  @IsString()
  exoneration_type?: string;

  @ApiPropertyOptional({ example: 'EXO-2026-0001' })
  @IsOptional()
  @IsString()
  exoneration_document_number?: string;

  @ApiPropertyOptional({ example: 'Ministerio de Hacienda' })
  @IsOptional()
  @IsString()
  exoneration_institution?: string;

  @ApiPropertyOptional({
    example: '2026-03-10',
    description: 'Fecha ISO 8601 sin hora.',
  })
  @IsOptional()
  @IsDateString()
  exoneration_issue_date?: string;

  @ApiPropertyOptional({ example: 50, minimum: 0, maximum: 100 })
  @IsOptional()
  @Min(0)
  @Max(100)
  exoneration_percentage?: number;
}
