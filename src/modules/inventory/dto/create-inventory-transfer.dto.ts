import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayUnique,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateInventoryTransferDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  origin_warehouse_id!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  destination_warehouse_id!: number;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  origin_location_id?: number | null;

  @ApiPropertyOptional({ example: 8 })
  @IsOptional()
  @IsInt()
  destination_location_id?: number | null;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsInt()
  product_id?: number | null;

  @ApiPropertyOptional({ example: 5 })
  @IsOptional()
  @IsInt()
  product_variant_id?: number | null;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  inventory_lot_id?: number | null;

  @ApiProperty({ example: 5 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiPropertyOptional({ example: 12500 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  unit_cost?: number | null;

  @ApiPropertyOptional({ example: 'transfer_request' })
  @IsOptional()
  @IsString()
  reference_type?: string | null;

  @ApiPropertyOptional({ example: 18 })
  @IsOptional()
  @IsInt()
  reference_id?: number | null;

  @ApiPropertyOptional({ example: 'Traslado a sucursal secundaria' })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({
    type: [Number],
    example: [101, 102],
    description:
      'Seriales a transferir cuando la variante utiliza serial tracking.',
  })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  serial_ids?: number[];
}
