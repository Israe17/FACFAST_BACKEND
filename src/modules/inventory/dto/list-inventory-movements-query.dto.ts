import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { InventoryMovementHeaderType } from '../enums/inventory-movement-header-type.enum';
import { InventoryMovementStatus } from '../enums/inventory-movement-status.enum';

export class ListInventoryMovementsQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por bodega presente en al menos una linea del movimiento.',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouse_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por variante presente en al menos una linea del movimiento.',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  product_variant_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por producto presente en al menos una linea del movimiento.',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  product_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por usuario que realizó el movimiento (performed_by_user_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  performed_by_user_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por sucursal del encabezado del movimiento (branch_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branch_id?: number;

  @ApiPropertyOptional({
    description:
      'Fecha mínima (occurred_at >= from). Formato ISO 8601 (YYYY-MM-DD o full ISO).',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description:
      'Fecha máxima (occurred_at <= to). Formato ISO 8601 (YYYY-MM-DD o full ISO).',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status del movimiento.',
    enum: InventoryMovementStatus,
  })
  @IsOptional()
  @IsEnum(InventoryMovementStatus)
  status?: InventoryMovementStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de movimiento (movement_type).',
    enum: InventoryMovementHeaderType,
  })
  @IsOptional()
  @IsEnum(InventoryMovementHeaderType)
  movement_type?: InventoryMovementHeaderType;
}
