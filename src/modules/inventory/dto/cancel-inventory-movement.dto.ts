import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelInventoryMovementDto {
  @ApiPropertyOptional({
    example: 'Se revierte por error de digitacion',
  })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
