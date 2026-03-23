import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDispatchStopDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  sale_order_id!: number;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  delivery_sequence?: number;

  @ApiPropertyOptional({ example: 'Call before arrival' })
  @IsOptional()
  @IsString()
  notes?: string;
}
