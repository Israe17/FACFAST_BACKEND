import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class CreateTaxProfileDto {
  @ApiPropertyOptional({ example: 'TF-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'IVA General Bienes' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Perfil fiscal para bienes gravados al 13%' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiProperty({ example: '1234567890123' })
  @IsString()
  @Matches(NUMERIC_STRING_PATTERN)
  cabys_code!: string;

  @ApiProperty({ enum: TaxProfileItemKind, example: TaxProfileItemKind.GOODS })
  @IsEnum(TaxProfileItemKind)
  item_kind!: TaxProfileItemKind;

  @ApiProperty({ enum: TaxType, example: TaxType.IVA })
  @IsEnum(TaxType)
  tax_type!: TaxType;

  @ApiPropertyOptional({ example: '08' })
  @IsOptional()
  @IsString()
  iva_rate_code?: string | null;

  @ApiPropertyOptional({ example: 13, minimum: 0, maximum: 100 })
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

  @ApiPropertyOptional({ example: 'Impuesto especifico' })
  @IsOptional()
  @IsString()
  specific_tax_name?: string | null;

  @ApiPropertyOptional({ example: 0.25, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  specific_tax_rate?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
