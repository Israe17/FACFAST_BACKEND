import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { SerialStatus } from '../enums/serial-status.enum';

export class UpdateProductSerialStatusDto {
  @ApiProperty({
    description: 'Nuevo estado operativo del serial.',
    enum: SerialStatus,
  })
  @IsEnum(SerialStatus)
  status!: SerialStatus;

  @ApiPropertyOptional({
    description: 'Notas opcionales para el cambio de estado.',
    type: String,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
