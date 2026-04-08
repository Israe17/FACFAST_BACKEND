import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional } from 'class-validator';

export class ResetSaleOrderDispatchDto {
  @ApiPropertyOptional({
    description: 'New delivery requested date for re-dispatch (YYYY-MM-DD)',
    example: '2026-04-10',
  })
  @IsOptional()
  @IsDateString()
  delivery_requested_date?: string;
}
