import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateProductPriceDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  product_variant_id?: number | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  price_list_id!: number;

  @ApiProperty({ example: 15000 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  price!: number;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  min_quantity?: number | null;

  @ApiPropertyOptional({ example: '2026-03-10T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  valid_from?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z' })
  @IsOptional()
  @IsDateString()
  valid_to?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
