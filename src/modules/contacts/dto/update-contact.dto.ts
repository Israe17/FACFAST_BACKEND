import { ApiPropertyOptional } from '@nestjs/swagger';
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

export class UpdateContactDto {
  @ApiPropertyOptional({ example: 'CT-0042' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiPropertyOptional({
    enum: ContactType,
    example: ContactType.SUPPLIER,
  })
  @IsOptional()
  @IsEnum(ContactType)
  type?: ContactType;

  @ApiPropertyOptional({ example: 'Proveedor Regional' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Distribuciones del Valle' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  commercial_name?: string;

  @ApiPropertyOptional({
    enum: ContactIdentificationType,
    example: ContactIdentificationType.DIMEX,
  })
  @IsOptional()
  @IsEnum(ContactIdentificationType)
  identification_type?: ContactIdentificationType;

  @ApiPropertyOptional({ example: '155512345678' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  identification_number?: string;

  @ApiPropertyOptional({ example: 'contacto@proveedor.com', nullable: true })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: '2222-3333', nullable: true })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    example: 'Heredia, Ulloa, Zona Franca',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MinLength(5)
  address?: string;

  @ApiPropertyOptional({ example: 'Heredia', nullable: true })
  @IsOptional()
  @IsString()
  province?: string;

  @ApiPropertyOptional({ example: 'Heredia', nullable: true })
  @IsOptional()
  @IsString()
  canton?: string;

  @ApiPropertyOptional({ example: 'Ulloa', nullable: true })
  @IsOptional()
  @IsString()
  district?: string;

  @ApiPropertyOptional({ example: 'simplificado', nullable: true })
  @IsOptional()
  @IsString()
  tax_condition?: string;

  @ApiPropertyOptional({ example: '466100', nullable: true })
  @IsOptional()
  @IsString()
  economic_activity_code?: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'government', nullable: true })
  @IsOptional()
  @IsString()
  exoneration_type?: string;

  @ApiPropertyOptional({ example: 'DOC-EXO-01', nullable: true })
  @IsOptional()
  @IsString()
  exoneration_document_number?: string;

  @ApiPropertyOptional({ example: 'CCSS', nullable: true })
  @IsOptional()
  @IsString()
  exoneration_institution?: string;

  @ApiPropertyOptional({ example: '2026-03-10', nullable: true })
  @IsOptional()
  @IsDateString()
  exoneration_issue_date?: string;

  @ApiPropertyOptional({
    example: 13,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @Min(0)
  @Max(100)
  exoneration_percentage?: number;
}
