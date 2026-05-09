import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { SaleOrderStatus } from '../enums/sale-order-status.enum';

export class ListSaleOrdersQueryDto extends CursorQueryDto {
  @ApiPropertyOptional({
    description: 'Filtrar por usuario que creó la orden de venta (created_by_user_id).',
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

  @ApiPropertyOptional({
    description:
      'Fecha mínima (order_date >= from). Formato ISO 8601 (YYYY-MM-DD o full ISO).',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description:
      'Fecha máxima (order_date <= to). Formato ISO 8601 (YYYY-MM-DD o full ISO).',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status de la orden.',
    enum: SaleOrderStatus,
  })
  @IsOptional()
  @IsEnum(SaleOrderStatus)
  status?: SaleOrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por contacto cliente (customer_contact_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_contact_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por bodega (warehouse_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  warehouse_id?: number;
}
