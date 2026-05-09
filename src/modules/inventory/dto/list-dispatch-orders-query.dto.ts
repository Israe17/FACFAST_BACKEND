import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';

export class ListDispatchOrdersQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por usuario que creó la orden de despacho (created_by_user_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  created_by_user_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por sucursal de la orden (branch_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  branch_id?: number;
}
