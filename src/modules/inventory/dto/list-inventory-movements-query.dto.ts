import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';

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
}
