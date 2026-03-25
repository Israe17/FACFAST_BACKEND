import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { DispatchStopStatus } from '../enums/dispatch-stop-status.enum';

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
}
