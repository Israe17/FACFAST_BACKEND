import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import {
  GENERIC_ENTITY_CODE_PATTERN,
  NUMERIC_STRING_PATTERN,
} from '../../common/utils/validation-patterns.util';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';
import { TaxType } from '../enums/tax-type.enum';

export class UpdateTaxProfileDto {
  @ApiPropertyOptional({ example: 'TF-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'Exento servicios medicos' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Perfil exento', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: '9876543210123' })
  @IsOptional()
  @IsString()
  @Matches(NUMERIC_STRING_PATTERN)
  cabys_code?: string;

  @ApiPropertyOptional({ enum: TaxProfileItemKind })
  @IsOptional()
  @IsEnum(TaxProfileItemKind)
  item_kind?: TaxProfileItemKind;

  @ApiPropertyOptional({ enum: TaxType })
  @IsOptional()
  @IsEnum(TaxType)
  tax_type?: TaxType;

  @ApiPropertyOptional({ example: '08', nullable: true })
  @IsOptional()
  @IsString()
  iva_rate_code?: string | null;

  @ApiPropertyOptional({
    example: 13,
    minimum: 0,
    maximum: 100,
    nullable: true,
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  @Max(100)
  iva_rate?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  requires_cabys?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  allows_exoneration?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  has_specific_tax?: boolean;

  @ApiPropertyOptional({ example: 'Impuesto especifico', nullable: true })
  @IsOptional()
  @IsString()
  specific_tax_name?: string | null;

  @ApiPropertyOptional({ example: 0.25, minimum: 0, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  specific_tax_rate?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
