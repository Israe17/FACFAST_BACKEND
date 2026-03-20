import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePriceListBranchAssignmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  branch_id!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ example: 'Lista habilitada para ventas retail' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
