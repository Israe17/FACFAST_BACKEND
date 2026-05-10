import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { CursorQueryDto } from '../../common/dto/cursor-query.dto';
import { DispatchOrderStatus } from '../enums/dispatch-order-status.enum';
import { DispatchType } from '../enums/dispatch-type.enum';

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

  @ApiPropertyOptional({
    description:
      'Fecha mínima (scheduled_date >= from). Formato ISO 8601 (YYYY-MM-DD o full ISO).',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({
    description:
      'Fecha máxima (scheduled_date <= to). Formato ISO 8601 (YYYY-MM-DD o full ISO).',
    type: String,
  })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description: 'Filtrar por status de la orden de despacho.',
    enum: DispatchOrderStatus,
  })
  @IsOptional()
  @IsEnum(DispatchOrderStatus)
  status?: DispatchOrderStatus;

  @ApiPropertyOptional({
    description: 'Filtrar por tipo de despacho (dispatch_type).',
    enum: DispatchType,
  })
  @IsOptional()
  @IsEnum(DispatchType)
  dispatch_type?: DispatchType;

  @ApiPropertyOptional({
    description: 'Filtrar por vehículo asignado (vehicle_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vehicle_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por conductor asignado (driver_user_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  driver_user_id?: number;

  @ApiPropertyOptional({
    description: 'Filtrar por ruta (route_id).',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  route_id?: number;

  @ApiPropertyOptional({
    description:
      'Filtrar por cliente (customer_contact_id). Coincide cuando alguna stop del despacho está asignada a ese contacto.',
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  customer_contact_id?: number;
}
