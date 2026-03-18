import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

export class CreateProductVariantDto {
  @ApiProperty({ example: 'SKU-IPHONE-BLK-128' })
  @IsString()
  @MinLength(1)
  sku!: string;

  @ApiPropertyOptional({ example: '7501234567891' })
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @ApiProperty({ example: 'Negro - 128GB' })
  @IsString()
  @MinLength(1)
  variant_name!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  stock_unit_measure_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  sale_unit_measure_id?: number | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  fiscal_profile_id!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  default_warranty_profile_id?: number | null;

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
  track_serials?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
