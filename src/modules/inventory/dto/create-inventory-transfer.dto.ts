import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateInventoryTransferDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  origin_warehouse_id!: number;

  @ApiProperty({ example: 2 })
  @IsInt()
  destination_warehouse_id!: number;

  @ApiProperty({ example: 3 })
  @IsInt()
  product_id!: number;

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
}
