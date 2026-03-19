import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';

export class UpdateProductPriceDto {
  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  product_variant_id?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  price_list_id?: number;

  @ApiPropertyOptional({ example: 16000 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  price?: number;

  @ApiPropertyOptional({ example: 10, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  min_quantity?: number | null;

  @ApiPropertyOptional({ example: '2026-03-10T00:00:00.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  valid_from?: string | null;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.000Z', nullable: true })
  @IsOptional()
  @IsDateString()
  valid_to?: string | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
