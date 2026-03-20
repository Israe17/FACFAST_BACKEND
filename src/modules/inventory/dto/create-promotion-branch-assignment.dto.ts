import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsInt, IsOptional, IsString } from 'class-validator';

export class CreatePromotionBranchAssignmentDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  branch_id!: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({ example: 'Solo aplica en sucursales urbanas' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
