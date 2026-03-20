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
import { ProductType } from '../enums/product-type.enum';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'PD-0002' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string | null;

  @ApiPropertyOptional({ enum: ProductType })
  @IsOptional()
  @IsEnum(ProductType)
  type?: ProductType;

  @ApiPropertyOptional({ example: 'Servicio de balanceo' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @ApiPropertyOptional({ example: 'Descripcion ajustada', nullable: true })
  @IsOptional()
  @IsString()
  description?: string | null;

  @ApiPropertyOptional({ example: 2, nullable: true })
  @IsOptional()
  @IsInt()
  category_id?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  brand_id?: number | null;

  @ApiPropertyOptional({ example: 'SKU-001', nullable: true })
  @IsOptional()
  @IsString()
  sku?: string | null;

  @ApiPropertyOptional({ example: '1234567890123', nullable: true })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  stock_unit_id?: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  sale_unit_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  tax_profile_id?: number;

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
  track_serials?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  allow_negative_stock?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  has_variants?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  has_warranty?: boolean;

  @ApiPropertyOptional({ example: 1, nullable: true })
  @IsOptional()
  @IsInt()
  warranty_profile_id?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
