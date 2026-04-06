import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';

export class DeliveredLineDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sale_order_line_id!: number;

  @ApiProperty({ example: 7.5 })
  @IsNumber()
  @Min(0)
  delivered_quantity!: number;
}

export class UpdateDispatchStopStatusDto {
  @ApiProperty({ enum: DispatchStopStatus, example: DispatchStopStatus.DELIVERED })
  @IsEnum(DispatchStopStatus)
  status!: DispatchStopStatus;

  @ApiPropertyOptional({ example: 'Juan Perez' })
  @IsOptional()
  @IsString()
  received_by?: string;

  @ApiPropertyOptional({ example: 'Cliente ausente en la direccion' })
  @IsOptional()
  @IsString()
  failure_reason?: string;

  @ApiPropertyOptional({ example: 'Entrega realizada en recepcion' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    type: [DeliveredLineDto],
    description: 'Required when status is partial. Per-line delivered quantities.',
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeliveredLineDto)
  delivered_lines?: DeliveredLineDto[];
}
