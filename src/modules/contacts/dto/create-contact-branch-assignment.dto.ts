import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateContactBranchAssignmentDto {
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

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  is_preferred?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  is_exclusive?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  sales_enabled?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  purchases_enabled?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  credit_enabled?: boolean;

  @ApiPropertyOptional({ example: 150000, nullable: true })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  custom_credit_limit?: number | null;

  @ApiPropertyOptional({ example: 3, nullable: true })
  @IsOptional()
  @IsInt()
  custom_price_list_id?: number | null;

  @ApiPropertyOptional({ example: 12, nullable: true })
  @IsOptional()
  @IsInt()
  account_manager_user_id?: number | null;

  @ApiPropertyOptional({ example: 'Cliente preferente en esta sucursal' })
  @IsOptional()
  @IsString()
  notes?: string | null;
}
