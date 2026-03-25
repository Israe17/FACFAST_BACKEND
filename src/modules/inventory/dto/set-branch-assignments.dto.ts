import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ArrayUnique, IsArray, IsBoolean, IsInt, IsOptional } from 'class-validator';

export class SetBranchAssignmentsDto {
  @ApiProperty({ example: false })
  @IsBoolean()
  is_global!: boolean;

  @ApiPropertyOptional({ example: [1, 2] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsInt({ each: true })
  assigned_branch_ids?: number[];
}
