import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
import { ProductType } from '../enums/product-type.enum';

export class CreateProductDto {
  @ApiPropertyOptional({ example: 'PD-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ enum: ProductType, example: ProductType.PRODUCT })
  @IsEnum(ProductType)
  type!: ProductType;

  @ApiProperty({ example: 'Llanta 185/65 R15' })
  @IsString()
  @MinLength(2)
  name!: string;

  @ApiPropertyOptional({ example: 'Llanta radial para automovil' })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  category_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  brand_id?: number | null;

  @ApiPropertyOptional({ example: 'SKU-LL-185' })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: '7501234567890' })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  stock_unit_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sale_unit_id?: number | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  tax_profile_id!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  track_inventory?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  track_lots?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  track_expiration?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  has_warranty?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  warranty_profile_id?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
