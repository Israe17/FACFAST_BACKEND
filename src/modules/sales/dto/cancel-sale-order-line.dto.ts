import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CancelSaleOrderLineDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
