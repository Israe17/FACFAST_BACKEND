import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';
import { TaxProfileItemKind } from '../enums/tax-profile-item-kind.enum';

export class UpdateProductCategoryDto {
  @ApiPropertyOptional({ example: 'CG-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ example: 'Bebidas' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Subcategoria de bebidas' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  parent_id?: number | null;

  @ApiPropertyOptional({ example: '2132100000100' })
  @IsOptional()
  @IsString()
  cabys_code?: string | null;

  @ApiPropertyOptional({ example: 'Lavadoras de ropa' })
  @IsOptional()
  @IsString()
  cabys_descripcion?: string | null;

  @ApiPropertyOptional({ example: 13 })
  @IsOptional()
  @IsInt()
  cabys_impuesto?: number | null;

  @ApiPropertyOptional({ enum: TaxProfileItemKind, example: TaxProfileItemKind.GOODS })
  @IsOptional()
  @IsEnum(TaxProfileItemKind)
  item_kind?: TaxProfileItemKind;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
