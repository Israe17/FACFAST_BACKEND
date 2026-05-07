import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class CreateProductCategoryDto {
  @ApiPropertyOptional({ example: 'CG-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 'Alimentos' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Categoria principal de alimentos' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 1 })
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
