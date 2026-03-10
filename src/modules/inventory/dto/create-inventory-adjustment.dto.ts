import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { InventoryMovementType } from '../enums/inventory-movement-type.enum';

export class CreateInventoryAdjustmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  warehouse_id!: number;

  @ApiPropertyOptional({ example: 2 })
  @IsOptional()
  @IsInt()
  location_id?: number | null;

  @ApiProperty({ example: 3 })
  @IsInt()
  product_id!: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  inventory_lot_id?: number | null;

  @ApiProperty({
    enum: [
      InventoryMovementType.ADJUSTMENT_IN,
      InventoryMovementType.ADJUSTMENT_OUT,
    ],
    example: InventoryMovementType.ADJUSTMENT_IN,
  })
  @IsEnum(InventoryMovementType)
  movement_type!: InventoryMovementType;

  @ApiProperty({ example: 5 })
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0.0001)
  quantity!: number;

  @ApiPropertyOptional({ example: 'inventory_lot' })
  @IsOptional()
  @IsString()
  reference_type?: string | null;

  @ApiPropertyOptional({ example: 15 })
  @IsOptional()
  @IsInt()
  reference_id?: number | null;

  @ApiPropertyOptional({ example: 'Ajuste por conteo fisico' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
