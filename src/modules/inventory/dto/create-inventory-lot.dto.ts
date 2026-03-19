import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Min,
  MinLength,
} from 'class-validator';
import { GENERIC_ENTITY_CODE_PATTERN } from '../../common/utils/validation-patterns.util';

export class CreateInventoryLotDto {
  @ApiPropertyOptional({ example: 'LT-0001' })
  @IsOptional()
  @Matches(GENERIC_ENTITY_CODE_PATTERN)
  code?: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  warehouse_id!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  location_id?: number | null;

  @ApiProperty({ example: 1 })
  @IsInt()
  product_id!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  product_variant_id?: number | null;

  @ApiProperty({ example: 'L-2026-0001' })
  @IsString()
  @MinLength(2)
  lot_number!: string;

  @ApiPropertyOptional({ example: '2026-12-31' })
  @IsOptional()
  @IsDateString()
  expiration_date?: string | null;

  @ApiPropertyOptional({ example: '2026-01-10' })
  @IsOptional()
  @IsDateString()
  manufacturing_date?: string | null;

  @ApiPropertyOptional({ example: '2026-03-10T15:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  received_at?: string | null;

  @ApiProperty({ example: 25 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  initial_quantity!: number;

  @ApiPropertyOptional({ example: 3500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unit_cost?: number | null;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  supplier_contact_id?: number | null;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;
}
