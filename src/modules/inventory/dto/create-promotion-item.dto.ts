import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, Min } from 'class-validator';

export class CreatePromotionItemDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  product_id?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  product_variant_id?: number | null;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  min_quantity?: number | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  discount_value?: number | null;

  @ApiPropertyOptional({ example: 12500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  override_price?: number | null;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  bonus_quantity?: number | null;
}
