import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdatePromotionBranchAssignmentDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'Promocion reactivada para esta sucursal' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
