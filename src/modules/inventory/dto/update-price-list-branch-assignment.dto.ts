import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePriceListBranchAssignmentDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_default?: boolean;

  @ApiPropertyOptional({ example: 'Lista temporalmente deshabilitada' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
